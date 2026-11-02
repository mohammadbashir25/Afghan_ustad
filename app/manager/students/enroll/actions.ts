"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import ClassRecord from "@/models/Class";
import Enrollment from "@/models/Enrollment";
import Payment from "@/models/Payment";
import AuditLog from "@/models/AuditLog";
import Notification from "@/models/Notification";

export async function enrollExistingStudentAction(fd: FormData) {
  const s = await requireRole(["MANAGER"]);

  const studentId = String(fd.get("studentId") || "");
  const courseId = String(fd.get("courseId") || "");
  const classId = String(fd.get("classId") || "");
  const method = String(fd.get("method") || "CASH");
  const discount = Number(fd.get("discountAmount") || 0);
  const amount = Number(fd.get("amountPaid") || 0);

  const base = "/manager/students/enroll";

  // Validate submitted data
  if (
    !/^[a-f\d]{24}$/i.test(studentId) ||
    !/^[a-f\d]{24}$/i.test(courseId) ||
    (classId && !/^[a-f\d]{24}$/i.test(classId)) ||
    !Number.isFinite(discount) ||
    discount < 0 ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    !(["CASH", "BANK", "MOBILE_MONEY", "OTHER"] as string[]).includes(method)
  ) {
    redirect(`${base}?error=invalid`);
  }

  await connectDB();

  // Find existing student and active course
  const [student, course] = await Promise.all([
    User.findOne({
      _id: studentId,
      role: "STUDENT",
    })
      .select("name studentId isActive")
      .lean(),

    Course.findOne({
      _id: courseId,
      status: "ACTIVE",
    })
      .select("title fee")
      .lean(),
  ]);

  if (!student || !course) {
    redirect(`${base}?error=record`);
  }

  // Validate discount and payment
  if (discount > course.fee || amount > course.fee - discount) {
    redirect(`${base}?error=amount`);
  }

  // Validate class
  const cls = classId
    ? await ClassRecord.findOne({
        _id: classId,
        course: courseId,
        status: { $ne: "COMPLETED" },
      })
        .select("_id")
        .lean()
    : null;

  if (classId && !cls) {
    redirect(`${base}?error=class`);
  }

  // Prevent duplicate enrollment
  const duplicate = await Enrollment.exists({
    student: studentId,
    course: courseId,
    class: cls?._id ?? null,
    status: { $ne: "CANCELLED" },
  });

  if (duplicate) {
    redirect(`${base}?error=duplicate`);
  }

  const fee = course.fee - discount;
  const balance = fee - amount;
  const active = balance === 0;

  // IMPORTANT:
  // Do not generate or change the student's login PIN here.
  // The existing student's PIN belongs to their User account.

  const enrollment = await Enrollment.create({
    student: studentId,
    course: courseId,
    class: cls?._id ?? null,
    courseName: course.title,
    enrollmentPin: "",
    courseFee: fee,
    discountAmount: discount,
    status: active ? "ACTIVE" : "PENDING_PAYMENT",
  });

  // Notifications
  try {
    await Notification.create({
      recipient: studentId,
      title: "Course enrollment created",
      message: `You have been enrolled in ${course.title}. Course fee after discount: ${fee.toLocaleString()} AFN. Initial balance: ${balance.toLocaleString()} AFN.`,
      kind: "ACADEMIC",
      sourceId: String(enrollment._id),
    });

    const admins = await User.find({
      role: "SUPER_ADMIN",
      isActive: true,
    })
      .select("_id")
      .lean();

    if (admins.length) {
      await Notification.insertMany(
        admins.map((admin) => ({
          recipient: admin._id,
          title: "Student enrolled in a course",
          message: `${student.name} was enrolled in ${course.title} by a manager. Fee: ${fee.toLocaleString()} AFN; initial balance: ${balance.toLocaleString()} AFN.`,
          kind: "ACADEMIC",
          sourceId: String(enrollment._id),
        })),
      );
    }
  } catch (notificationError) {
    console.error("Enrollment notification delivery failed", notificationError);
  }

  // Create payment record if money was paid
  if (amount > 0) {
    const receiptNumber = `AUP-${Date.now()}-${randomInt(1000, 9999)}`;

    await Payment.create({
      receiptNumber,
      student: studentId,
      enrollment: enrollment._id,
      class: cls?._id ?? null,
      studentName: student.name,
      studentId: student.studentId || "",
      courseName: course.title,
      courseFee: fee,
      discountAmount: discount,
      amountPaid: amount,
      balanceAfterPayment: balance,
      method,
      paidAt: new Date(),
      receivedBy: s.user.id,
    });
  }

  // Activate student if the balance is fully paid
  if (active) {
    await User.updateOne({ _id: studentId }, { $set: { isActive: true } });
  }

  // Audit log
  await AuditLog.create({
    actor: s.user.id,
    actorName: s.user.name || s.user.email || "Manager",
    action: "STUDENT_ENROLLED_IN_CLASS",
    targetType: "Enrollment",
    targetId: String(enrollment._id),
    details: `${student.name} enrolled in ${course.title}; fee ${fee} AFN after ${discount} AFN discount; paid ${amount} AFN; balance ${balance} AFN.`,
  });

  // Refresh relevant pages
  revalidatePath("/manager/students");
  revalidatePath("/manager/student-history");
  revalidatePath("/manager/finance");
  revalidatePath("/student");
  revalidatePath("/admin/audit-logs");

  redirect(`${base}/receipt/${String(enrollment._id)}`);
}
