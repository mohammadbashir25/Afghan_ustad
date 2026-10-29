"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";

import ClassRecord from "@/models/Class";
import Course from "@/models/Course";
import User from "@/models/User";
import Attendance from "@/models/Attendance";
import AuditLog from "@/models/AuditLog";

const val = (fd: FormData, key: string) => String(fd.get(key) || "").trim();

export async function saveCheckboxAttendanceAction(fd: FormData) {
  // Only Skill Center Guides may record student attendance.
  const session = await requireRole(["GUIDE"]);

  const classId = val(fd, "classId");
  const studentId = val(fd, "studentId");
  const dateText = val(fd, "date");
  const present = fd.get("present") === "on";

  const base = "/guide/attendance";

  // Validate submitted values.
  if (
    !/^[a-f\d]{24}$/i.test(classId) ||
    !/^[a-f\d]{24}$/i.test(studentId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateText)
  ) {
    redirect(`${base}?error=invalid`);
  }

  // Prevent invalid calendar dates such as 2026-02-31.
  const date = new Date(`${dateText}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateText
  ) {
    redirect(`${base}?error=invalid`);
  }

  await connectDB();

  // Verify that this class is assigned to the current guide.
  const cls = await ClassRecord.findOne({
    _id: classId,
    guide: session.user.id,
  })
    .select("guide course status")
    .lean();

  if (!cls || cls.status === "COMPLETED") {
    redirect(`${base}?error=class`);
  }

  // Verify that the student exists and is active.
  const [student, course] = await Promise.all([
    User.findOne({
      _id: studentId,
      role: "STUDENT",
      isActive: true,
    })
      .select("course class courseName")
      .lean(),

    Course.findById(cls.course).select("title").lean(),
  ]);

  if (!student) {
    redirect(`${base}?error=student`);
  }

  // Confirm that the student belongs to this class or course.
  // Supports both class-based and legacy course-based student records.
  const enrolled = student.class
    ? String(student.class) === classId
    : (student.course && String(student.course) === String(cls.course)) ||
      (course?.title && student.courseName === course.title);

  if (!enrolled) {
    redirect(`${base}?error=student`);
  }

  // Create or update the attendance record for this student,
  // class, and date. Re-saving updates the existing record.
  const record = await Attendance.findOneAndUpdate(
    {
      student: studentId,
      class: classId,
      date,
    },
    {
      $set: {
        student: studentId,
        class: classId,
        date,
        status: present ? "PRESENT" : "ABSENT",
        markedBy: session.user.id,
        notes: "",
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  );

  // Keep an audit trail of the attendance change.
  await AuditLog.create({
    actor: session.user.id,
    actorName: session.user.name || "Guide",
    action: "STUDENT_ATTENDANCE_SAVED",
    targetType: "Attendance",
    targetId: String(record._id),
    details: `Marked student ${studentId} as ${
      present ? "PRESENT" : "ABSENT"
    } for class ${classId} on ${dateText}.`,
  });

  // Refresh affected attendance pages and audit logs.
  revalidatePath("/guide/attendance");
  revalidatePath("/guide/students");
  revalidatePath("/student/attendance");
  revalidatePath("/manager/attendance");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/audit-logs");

  redirect(`${base}?date=${dateText}&saved=1`);
}
