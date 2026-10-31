"use server";

import { randomInt } from "node:crypto";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { studentRegistrationSchema } from "@/lib/student/registration-validation";
import User from "@/models/User";
import Payment from "@/models/Payment";
import Course from "@/models/Course";
import ClassRecord from "@/models/Class";
import Enrollment from "@/models/Enrollment";
import { put } from "@vercel/blob";

export type RegistrationState = {
  status: "idle" | "error" | "success";
  message?: string;
  receipt?: {
    studentName: string;
    studentId: string;
    username: string;
    initialPin: string;
    courseName: string;
    className: string;
    teacherName: string;
    classSchedule: string;
    courseFee: number;
    amountPaid: number;
    balance: number;
    receiptNumber: string | null;
    method: string;
    paidAt: string;
  };
};
const initial: RegistrationState = { status: "idle" };
const textField = (fd: FormData, key: string) => {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
};
const makeStudentId = () =>
  `AU-${new Date().getFullYear()}-${randomInt(0, 1_000_000).toString().padStart(6, "0")}`;
const makeReceiptNumber = () => `AUP-${Date.now()}-${randomInt(1000, 9999)}`;

export async function registerStudentAction(
  previous: RegistrationState = initial,
  fd: FormData,
): Promise<RegistrationState> {
  void previous;

  const session = await auth();

  if (!session?.user) {
    return {
      status: "error",
      message: "Session expired. Please sign in again.",
    };
  }

  if (session.user.role !== "MANAGER") {
    return {
      status: "error",
      message: "You are not allowed to register students.",
    };
  }

  const parsed = studentRegistrationSchema.safeParse({
    registrationDate: textField(fd, "registrationDate"),
    name: textField(fd, "name"),
    fatherName: textField(fd, "fatherName"),
    whatsappNumber: textField(fd, "whatsappNumber"),
    username: textField(fd, "username").toLowerCase(),
    courseId: textField(fd, "courseId"),
    classId: textField(fd, "classId") || undefined,
    amountPaid: textField(fd, "amountPaid"),
    discountAmount: textField(fd, "discountAmount") || "0",
    method: textField(fd, "method"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the form.",
    };
  }

  const input = parsed.data;
  // Generate a private six-digit PIN only when creating a brand-new student.
  const initialPin = String(randomInt(100000, 1_000_000));

  // Tracks the operation that fails.
  let stage = "initialization";

  try {
    stage = "database connection";
    await connectDB();

    stage = "course lookup";
    const course = await Course.findOne({
      _id: input.courseId,
      status: "ACTIVE",
    })
      .select("title fee")
      .lean();

    if (!course) {
      return {
        status: "error",
        message: "Select an active course from the course catalogue.",
      };
    }

    if (input.discountAmount > course.fee) {
      return {
        status: "error",
        message: "Discount cannot exceed the selected course fee.",
      };
    }

    const adjustedFee = course.fee - input.discountAmount;

    if (input.amountPaid > adjustedFee) {
      return {
        status: "error",
        message: "Initial payment cannot exceed the fee after discount.",
      };
    }

    stage = "class lookup";
    const selectedClass = input.classId
      ? await ClassRecord.findOne({
          _id: input.classId,
          course: course._id,
          status: { $ne: "COMPLETED" },
        })
          .select("_id name schedule teacher")
          .populate("teacher", "name")
          .lean()
      : null;

    if (input.classId && !selectedClass) {
      return {
        status: "error",
        message: "Select a class that belongs to the chosen course.",
      };
    }

    stage = "existing student lookup";
    const existingStudent = await User.findOne({
      name: input.name,
      fatherName: input.fatherName,
      whatsappNumber: input.whatsappNumber,
      role: "STUDENT",
    })
      .select("_id")
      .lean();

    if (existingStudent) {
      return {
        status: "error",
        message:
          "This student already has an account. Use Enroll Existing Student to add another course or class.",
      };
    }

    stage = "username lookup";
    const existingUsername = await User.findOne({
      username: input.username,
    })
      .select("_id")
      .lean();

    if (existingUsername) {
      return {
        status: "error",
        message: "This username is already taken.",
      };
    }

    stage = "student ID generation";
    let studentId = "";

    for (let i = 0; i < 5; i++) {
      const candidate = makeStudentId();

      if (
        !(await User.findOne({ studentId: candidate }).select("_id").lean())
      ) {
        studentId = candidate;
        break;
      }
    }

    if (!studentId) {
      return {
        status: "error",
        message: "Could not generate an ID. Please retry.",
      };
    }

    let photoUrl = "";
    const rawPhoto = fd.get("photo");

    if (rawPhoto instanceof File && rawPhoto.size > 0) {
      if (
        rawPhoto.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(rawPhoto.type)
      ) {
        return {
          status: "error",
          message: "Photo must be JPG, PNG, or WebP and no larger than 5 MB.",
        };
      }

      stage = "student photo upload";

      try {
        const blob = await put(
          `student-photos/${studentId}-${Date.now()}`,
          rawPhoto,
          {
            access: "public",
            addRandomSuffix: true,
            contentType: rawPhoto.type,
          },
        );

        photoUrl = blob.url;
      } catch (error) {
        console.error("Student photo upload failed:", error);

        return {
          status: "error",
          message:
            "Photo upload failed. Check BLOB_READ_WRITE_TOKEN or register without a photo.",
        };
      }
    }

    const balance = Math.max(0, adjustedFee - input.amountPaid);
    const fullyPaid = balance === 0;

    stage = "User.create";

    const student = await User.create({
      registrationDate: new Date(`${input.registrationDate}T12:00:00.000Z`),
      name: input.name,
      fatherName: input.fatherName,
      whatsappNumber: input.whatsappNumber,
      photoUrl,
      username: input.username,
      studentId,
      pinHash: await bcrypt.hash(initialPin, 12),
      course: course._id,
      class: selectedClass?._id ?? null,
      courseName: course.title,
      courseFee: adjustedFee,
      discountAmount: input.discountAmount,
      role: "STUDENT",
      isActive: fullyPaid,
    });

    stage = "Enrollment.create";

    const enrollment = await Enrollment.create({
      student: student._id,
      course: course._id,
      class: selectedClass?._id ?? null,
      courseName: course.title,
      courseFee: adjustedFee,
      discountAmount: input.discountAmount,
      status: fullyPaid ? "ACTIVE" : "PENDING_PAYMENT",
    });

    const paidAt = new Date();
    let receiptNumber: string | null = null;

    if (input.amountPaid > 0) {
      stage = "receipt number generation";
      receiptNumber = makeReceiptNumber();

      stage = "Payment.create";

      await Payment.create({
        receiptNumber,
        student: student._id,
        enrollment: enrollment._id,
        studentName: input.name,
        studentId,
        courseName: course.title,
        className: selectedClass?.name || "Not assigned",
        teacherName:
          (selectedClass?.teacher as unknown as { name?: string } | null)
            ?.name || "Not assigned",
        classSchedule: selectedClass?.schedule || "Not assigned",
        courseFee: adjustedFee,
        discountAmount: input.discountAmount,
        class: selectedClass?._id ?? null,
        amountPaid: input.amountPaid,
        balanceAfterPayment: balance,
        method: input.method,
        paidAt,
        receivedBy: session.user.id,
      });
    }

    stage = "AuditLog model import";
    const AuditLog = (await import("@/models/AuditLog")).default;

    stage = "AuditLog.create";

    await AuditLog.create({
      actor: session.user.id,
      actorName: session.user.name || session.user.email || "Staff",
      action: "STUDENT_REGISTERED",
      targetType: "Student",
      targetId: String(student._id),
      details: `Registered ${input.name} (${studentId}) for ${course.title}; fee ${adjustedFee} AFN after ${input.discountAmount} AFN discount; initial payment ${input.amountPaid} AFN.`,
    });

    revalidatePath("/admin/students");
    revalidatePath("/manager/students");
    revalidatePath("/manager/student-history");
    revalidatePath("/admin/users");

    return {
      status: "success",
      message: fullyPaid
        ? "Student registered and activated after full payment."
        : "Student registered, but access remains locked until the course fee is fully paid.",
      receipt: {
        studentName: input.name,
        studentId,
        username: input.username,
        initialPin,
        courseName: course.title,
        className: selectedClass?.name || "Not assigned",
        teacherName:
          (selectedClass?.teacher as unknown as { name?: string } | null)
            ?.name || "Not assigned",
        classSchedule: selectedClass?.schedule || "Not assigned",
        courseFee: adjustedFee,
        amountPaid: input.amountPaid,
        balance,
        receiptNumber,
        method: input.method,
        paidAt: paidAt.toISOString(),
      },
    };
  } catch (error: unknown) {
    const err = error as {
      code?: number;
      keyPattern?: Record<string, unknown>;
      keyValue?: Record<string, unknown>;
      message?: string;
      index?: string;
      collection?: string;
      cause?: unknown;
    };

    // Print the actual error details in the server terminal.
    console.error("========== STUDENT REGISTRATION ERROR ==========");
    console.error("Failed stage:", stage);
    console.error("Error code:", err?.code);
    console.error("Collection:", err?.collection);
    console.error("Index:", err?.index);
    console.error("Conflicting fields:", err?.keyPattern);
    console.error("Conflicting values:", err?.keyValue);
    console.error("Full error message:", err?.message);
    console.error("Full error object:", error);
    console.error("================================================");

    if (err?.code === 11000) {
      const fields = err.keyPattern
        ? Object.keys(err.keyPattern).join(", ")
        : "Unknown field";

      return {
        status: "error",
        message: `Duplicate key during ${stage}. Field: ${fields}. Check the server terminal for the exact index and conflicting value.`,
      };
    }

    return {
      status: "error",
      message: `Registration failed during ${stage}. Check the server terminal for details.`,
    };
  }
}

export async function deleteStudentAction(
  studentId: string,
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN")
    return { success: false, message: "Only Super Admin can delete students." };
  if (!/^[a-f\d]{24}$/i.test(studentId))
    return { success: false, message: "Invalid student record." };
  try {
    await connectDB();
    const student = await User.findOne({ _id: studentId, role: "STUDENT" })
      .select("name studentId")
      .lean();
    if (!student) return { success: false, message: "Student not found." };
    const [Attendance, Performance, AssignmentSubmission] = await Promise.all([
      import("@/models/Attendance"),
      import("@/models/Performance"),
      import("@/models/AssignmentSubmission"),
    ]);
    await Payment.updateMany(
      { student: studentId },
      {
        $set: { studentName: student.name, studentId: student.studentId || "" },
      },
    );
    await Promise.all([
      Attendance.default.deleteMany({ student: studentId }),
      Performance.default.deleteMany({ student: studentId }),
      AssignmentSubmission.default.deleteMany({ student: studentId }),
    ]);
    await User.deleteOne({ _id: studentId, role: "STUDENT" });
    const AuditLog = (await import("@/models/AuditLog")).default;
    await AuditLog.create({
      actor: session.user.id,
      actorName: session.user.name || session.user.email || "Super Admin",
      action: "STUDENT_DELETED",
      targetType: "Student",
      targetId: studentId,
      details: `Deleted student ${student.name} (${student.studentId || studentId}).`,
    });
    revalidatePath("/admin/students");
    revalidatePath("/manager/students");
    return { success: true, message: "Student deleted." };
  } catch (error) {
    console.error("deleteStudentAction failed", error);
    return {
      success: false,
      message: "Could not delete student. Please check related records first.",
    };
  }
}

export async function updateStudentAction(
  fd: FormData,
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "MANAGER"].includes(session.user.role))
    return {
      success: false,
      message: "You are not allowed to edit student records.",
    };
  const studentId = textField(fd, "studentId");
  const name = textField(fd, "name").trim();
  const whatsappNumber = textField(fd, "whatsappNumber").trim();
  const fatherName = textField(fd, "fatherName").trim();
  if (
    !/^[a-f\d]{24}$/i.test(studentId) ||
    name.length < 2 ||
    name.length > 120 ||
    fatherName.length < 2 ||
    whatsappNumber.length < 7
  )
    return {
      success: false,
      message: "Please enter a valid name, father name, and WhatsApp number.",
    };
  try {
    await connectDB();

    const student = await User.findOne({ _id: studentId, role: "STUDENT" })
      .select("_id course class")
      .lean();
    if (!student) return { success: false, message: "Student not found." };

    const requestedClassId = textField(fd, "classId").trim();
    let selectedClassId: typeof student.class = null;

    if (requestedClassId) {
      if (!/^[a-f\d]{24}$/i.test(requestedClassId)) {
        return { success: false, message: "Please select a valid class." };
      }

      const selectedClass = await ClassRecord.findOne({
        _id: requestedClassId,
        status: { $ne: "COMPLETED" },
        ...(student.course ? { course: student.course } : {}),
      })
        .select("_id course")
        .lean();

      if (!selectedClass) {
        return {
          success: false,
          message:
            "The selected class is not active or does not belong to this student's course.",
        };
      }
      selectedClassId = selectedClass._id;

      // Avoid violating the unique student/course/class enrollment index.
      const duplicateEnrollment = await Enrollment.findOne({
        student: student._id,
        course: selectedClass.course,
        class: selectedClass._id,
        status: { $ne: "CANCELLED" },
      })
        .select("_id")
        .lean();
      const currentEnrollment = await Enrollment.findOne({
        student: student._id,
        course: selectedClass.course,
        status: { $in: ["ACTIVE", "PENDING_PAYMENT"] },
      })
        .sort({ enrolledAt: -1 })
        .select("_id class")
        .lean();

      if (
        duplicateEnrollment &&
        String(duplicateEnrollment._id) !== String(currentEnrollment?._id)
      ) {
        return {
          success: false,
          message:
            "This student already has an enrollment in that class. Please check the student's existing enrollments.",
        };
      }
    }

    const updated = await User.findOneAndUpdate(
      { _id: studentId, role: "STUDENT" },
      { $set: { name, fatherName, whatsappNumber, class: selectedClassId } },
      { new: true, runValidators: true },
    )
      .select("_id course class")
      .lean();
    if (!updated) return { success: false, message: "Student not found." };

    // Keep the student's current course enrollment in sync with the profile class.
    if (updated.course) {
      await Enrollment.findOneAndUpdate(
        {
          student: updated._id,
          course: updated.course,
          status: { $in: ["ACTIVE", "PENDING_PAYMENT"] },
        },
        { $set: { class: selectedClassId } },
        { sort: { enrolledAt: -1 }, new: true },
      );
    }

    const AuditLog = (await import("@/models/AuditLog")).default;
    await AuditLog.create({
      actor: session.user.id,
      actorName: session.user.name || session.user.email || "Staff",
      action: "STUDENT_UPDATED",
      targetType: "Student",
      targetId: studentId,
      details: `Updated personal/contact details and class assignment for ${name}. New class: ${selectedClassId ? String(selectedClassId) : "Unassigned"}.`,
    });
    revalidatePath("/admin/students");
    revalidatePath("/manager/students");
    revalidatePath("/manager/student-history");
    revalidatePath("/guide/attendance");
    revalidatePath("/guide/students");
    revalidatePath("/student");
    revalidatePath("/student/courses");
    return {
      success: true,
      message: "Student details and class assignment updated.",
    };
  } catch (error) {
    console.error("updateStudentAction failed", error);
    return { success: false, message: "Could not update the student record." };
  }
}
