"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";

import ClassRecord from "@/models/Class";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import Attendance from "@/models/Attendance";
import AuditLog from "@/models/AuditLog";

// ---------------------------------------------
// Types
// ---------------------------------------------

type EnrollmentData = {
  student: unknown;
};

type StudentData = {
  _id: unknown;
};

type ClassData = {
  _id: unknown;
  name?: string;
  course: unknown;
  status?: string;
};

type PopulatedCourse = {
  _id?: unknown;
  title?: string;
} | null;

// ---------------------------------------------
// Date validation
// ---------------------------------------------

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

// ---------------------------------------------
// Save class attendance
// ---------------------------------------------

export async function saveClassAttendanceAction(fd: FormData) {
  const session = await requireRole(["GUIDE"]);

  const classId = String(fd.get("classId") || "").trim();
  const dateText = String(fd.get("date") || "").trim();

  const base = "/guide/attendance";

  // Validate submitted information.
  if (
    !/^[a-f\d]{24}$/i.test(classId) ||
    !isValidDate(dateText)
  ) {
    redirect(`${base}?error=invalid`);
  }

  await connectDB();

  const day = new Date(`${dateText}T00:00:00.000Z`);

  // ---------------------------------------------
  // 1. Verify guide owns the class
  // ---------------------------------------------

  const cls = (await ClassRecord.findOne({
    _id: classId,
    guide: session.user.id,
  })
    .populate("course", "title")
    .select("course name status")
    .lean()) as unknown as ClassData | null;

  if (!cls || cls.status === "COMPLETED") {
    redirect(`${base}?error=class`);
  }

  const course = cls.course as PopulatedCourse;

  // ---------------------------------------------
  // 2. Get active enrollment records
  // ---------------------------------------------

  const enrollments = (await Enrollment.find({
    class: classId,
    status: "ACTIVE",
  })
    .select("student")
    .lean()) as unknown as EnrollmentData[];

  const studentIds = new Set<string>(
    enrollments
      .map((item) => String(item.student || ""))
      .filter(Boolean)
  );

  // ---------------------------------------------
  // 3. Support legacy student records
  // ---------------------------------------------

  const legacyStudents = (await User.find({
    role: "STUDENT",
    isActive: true,
    $or: [
      { class: classId },
      ...(course?._id
        ? [
            { class: null, course: course._id },
            { class: null, courseName: course.title },
          ]
        : []),
    ],
  })
    .select("_id")
    .lean()) as unknown as StudentData[];

  const legacyIds = legacyStudents.map((student) =>
    String(student._id)
  );

  // Avoid duplicate students already enrolled.
  const alreadyEnrolled = legacyIds.length
    ? ((await Enrollment.find({
        student: { $in: legacyIds },
      })
        .select("student")
        .lean()) as unknown as EnrollmentData[])
    : [];

  const enrolledElsewhere = new Set(
    alreadyEnrolled.map((item) =>
      String(item.student)
    )
  );

  legacyIds
    .filter((id) => !enrolledElsewhere.has(id))
    .forEach((id) => studentIds.add(id));

  const roster = [...studentIds];

  if (roster.length === 0) {
    redirect(`${base}?error=roster`);
  }

  // ---------------------------------------------
  // 4. Verify students are active
  // ---------------------------------------------

  const activeStudents = (await User.find({
    _id: { $in: roster },
    role: "STUDENT",
    isActive: true,
  })
    .select("_id")
    .lean()) as unknown as StudentData[];

  const validRoster = activeStudents.map((student) =>
    String(student._id)
  );

  if (validRoster.length === 0) {
    redirect(`${base}?error=roster`);
  }

  // ---------------------------------------------
  // 5. Validate submitted present students
  // ---------------------------------------------

  const rosterSet = new Set(validRoster);

  const submittedPresent = new Set(
    fd
      .getAll("presentStudent")
      .map((value) => String(value))
      .filter((id) => rosterSet.has(id))
  );

  // ---------------------------------------------
  // 6. Save attendance
  // ---------------------------------------------

  for (const studentId of validRoster) {
    await Attendance.findOneAndUpdate(
      {
        student: studentId,
        class: classId,
        date: day,
      },
      {
        $set: {
          student: studentId,
          class: classId,
          date: day,
          status: submittedPresent.has(studentId)
            ? "PRESENT"
            : "ABSENT",
          notes: "",
          markedBy: session.user.id,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  // ---------------------------------------------
  // 7. Calculate attendance summary
  // ---------------------------------------------

  const presentCount = validRoster.filter((id) =>
    submittedPresent.has(id)
  ).length;

  const absentCount = validRoster.length - presentCount;

  // ---------------------------------------------
  // 8. Create audit log
  // ---------------------------------------------

  await AuditLog.create({
    actor: session.user.id,
    actorName: session.user.name || "Guide",
    action: "CLASS_ATTENDANCE_SAVED",
    targetType: "ClassAttendance",
    targetId: `${classId}:${dateText}`,
    details: `Saved attendance for ${cls.name || "class"}: ${presentCount} present, ${absentCount} absent on ${dateText}.`,
  });

  // ---------------------------------------------
  // 9. Revalidate affected pages
  // ---------------------------------------------

  revalidatePath("/guide/attendance");
  revalidatePath("/guide/students");
  revalidatePath("/student/attendance");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/manager/attendance");
  revalidatePath("/admin/attendance");

  // Redirect after saving.
  redirect(`${base}?classId=${classId}&date=${dateText}&saved=1`);
}