"use server";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import AuditLog from "@/models/AuditLog";
import ClassRecord from "@/models/Class";
import Attendance from "@/models/Attendance";
import Assignment from "@/models/Assignment";
import Performance from "@/models/Performance";

const v = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const attendanceSchema = z.object({
  studentId: z.string().regex(/^[a-f\d]{24}$/i),
  classId: z.string().regex(/^[a-f\d]{24}$/i),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  notes: z.string().max(500).default(""),
});
const assignmentSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(3000).default(""),
  guidesAndTips: z.string().max(3000).default(""),
  courseId: z.string().regex(/^[a-f\d]{24}$/i),
  classId: z.string().regex(/^[a-f\d]{24}$/i),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]),
});
const performanceSchema = z
  .object({
    studentId: z.string().regex(/^[a-f\d]{24}$/i),
    courseId: z.string().regex(/^[a-f\d]{24}$/i),
    classId: z.string().optional(),
    assessment: z.string().min(2).max(160),
    score: z.coerce.number().finite().min(0),
    maxScore: z.coerce.number().finite().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.string().max(1000).default(""),
  })
  .refine((x) => x.score <= x.maxScore, {
    path: ["score"],
    message: "Score cannot exceed maximum marks.",
  });

export async function recordAttendanceAction(fd: FormData) {
  // Only the assigned Skill Center Guide can record student attendance.
  const s = await requireRole(["GUIDE"]);
  const base = "/guide/attendance";

  const p = attendanceSchema.safeParse({
    studentId: v(fd, "studentId"),
    classId: v(fd, "classId"),
    date: v(fd, "date"),
    status: v(fd, "status"),
    notes: v(fd, "notes"),
  });

  if (!p.success) {
    redirect(`${base}?error=invalid`);
  }

  const { studentId, classId, date: dateText, status, notes } = p.data;

  // Validate the actual calendar date.
  const date = new Date(`${dateText}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateText
  ) {
    redirect(`${base}?error=invalid`);
  }

  await connectDB();

  // The class must belong to the currently signed-in guide.
  const cls = await ClassRecord.findOne({
    _id: classId,
    guide: s.user.id,
  })
    .select("guide course")
    .lean();

  if (!cls) {
    redirect(`${base}?error=class`);
  }

  const [student, course] = await Promise.all([
    User.findOne({
      _id: studentId,
      role: "STUDENT",
      isActive: true,
    })
      .select("course courseName class")
      .lean(),

    Course.findById(cls.course)
      .select("title")
      .lean(),
  ]);

  if (!student) {
    redirect(`${base}?error=student`);
  }

  // Support existing student records and legacy course-based records.
  const enrolledInClass = student.class
    ? String(student.class) === classId
    : (
        (student.course &&
          String(student.course) === String(cls.course)) ||
        (course?.title &&
          student.courseName === course.title)
      );

  if (!enrolledInClass) {
    redirect(`${base}?error=student`);
  }

  try {
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
          status,
          notes,
          markedBy: s.user.id,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    await AuditLog.create({
      actor: s.user.id,
      actorName: s.user.name || "Guide",
      action: "STUDENT_ATTENDANCE_SAVED",
      targetType: "Attendance",
      targetId: String(record._id),
      details: `Marked student ${studentId} as ${status} for ${dateText}.`,
    });
  } catch (error) {
    console.error("Attendance save failed:", error);
    redirect(`${base}?error=save`);
  }

  revalidatePath("/guide/attendance");
  revalidatePath("/guide/students");
  revalidatePath("/student/attendance");
  revalidatePath("/manager/attendance");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/audit-logs");

  redirect(`${base}?date=${dateText}&saved=1`);
}

export async function createAssignmentAction(fd: FormData) {
  const s = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base =
    s.user.role === "GUIDE"
      ? "/guide/assignments"
      : s.user.role === "MANAGER"
        ? "/manager/assignments"
        : "/admin/assignments";
  const p = assignmentSchema.safeParse({
    title: v(fd, "title"),
    description: v(fd, "description"),
    guidesAndTips: v(fd, "guidesAndTips"),
    courseId: v(fd, "courseId"),
    classId: v(fd, "classId"),
    dueDate: v(fd, "dueDate"),
    status: v(fd, "status"),
  });
  if (!p.success) redirect(`${base}/new?error=invalid`);
  await connectDB();
  if (!(await Course.exists({ _id: p.data.courseId })))
    redirect(`${base}/new?error=course`);
  if (s.user.role === "GUIDE" && !p.data.classId)
    redirect(`${base}/new?error=class`);
  if (p.data.classId) {
    const cls = await ClassRecord.findById(p.data.classId)
      .select("guide course")
      .lean();
    if (!cls || String(cls.course) !== p.data.courseId)
      redirect(`${base}/new?error=class`);
    if (!cls.guide) redirect(`${base}/new?error=guide`);
  }
  const task = await Assignment.create({
    title: p.data.title,
    description: p.data.description,
    guidesAndTips: p.data.guidesAndTips,
    course: p.data.courseId,
    class: p.data.classId || null,
    dueDate: new Date(`${p.data.dueDate}T23:59:59.999Z`),
    status: p.data.status,
    createdBy: s.user.id,
  });
  await AuditLog.create({
    actor: s.user.id,
    actorName: s.user.name || s.user.email || "Staff",
    action: "SKILL_CENTER_TASK_CREATED",
    targetType: "Assignment",
    targetId: String(task._id),
    details: `Created task ${task.title} for class ${p.data.classId || "all course students"}.`,
  });
  revalidatePath("/admin/assignments");
  revalidatePath("/guide/assignments");
  revalidatePath("/student/assignments");
  redirect(`${base}?created=1`);
}
export async function recordPerformanceAction(fd: FormData) {
  const s = await requireRole(["SUPER_ADMIN", "MANAGER", "GUIDE"]);
  const p = performanceSchema.safeParse({
    studentId: v(fd, "studentId"),
    courseId: v(fd, "courseId"),
    classId: v(fd, "classId"),
    assessment: v(fd, "assessment"),
    score: v(fd, "score"),
    maxScore: v(fd, "maxScore"),
    date: v(fd, "date"),
    notes: v(fd, "notes"),
  });
  if (!p.success)
    redirect(
      `${s.user.role === "MANAGER" ? "/manager/performance" : s.user.role === "GUIDE" ? "/guide/kpa" : "/admin/academic-performance"}/new?error=invalid`,
    );
  if (s.user.role === "GUIDE" && !p.data.classId)
    redirect("/guide/kpa/new?error=class");
  await connectDB();
  const studentRecord = await User.findOne({
    _id: p.data.studentId,
    role: "STUDENT",
    isActive: true,
  })
    .select("course courseName class")
    .lean();
  const courseRecord = await Course.findById(p.data.courseId)
    .select("title")
    .lean();
  if (!studentRecord || !courseRecord)
    redirect(
      `${s.user.role === "MANAGER" ? "/manager/performance" : s.user.role === "GUIDE" ? "/guide/kpa" : "/admin/academic-performance"}/new?error=record`,
    );
  if (p.data.classId) {
    const cls = await ClassRecord.findById(p.data.classId)
      .select("guide course")
      .lean();
    if (!cls || String(cls.course) !== p.data.courseId)
      redirect(
        `${s.user.role === "MANAGER" ? "/manager/performance" : s.user.role === "GUIDE" ? "/guide/kpa" : "/admin/academic-performance"}/new?error=class`,
      );
    if (s.user.role === "GUIDE" && String(cls.guide) !== s.user.id)
      redirect("/login");
    const Enrollment = (await import("@/models/Enrollment")).default;
    const activeEnrollment = await Enrollment.exists({
      student: p.data.studentId,
      course: p.data.courseId,
      class: p.data.classId,
      status: "ACTIVE",
    });
    const hasAnyEnrollment = await Enrollment.exists({
      student: p.data.studentId,
    });
    const legacyMatch =
      !hasAnyEnrollment &&
      String(studentRecord.class || "") === p.data.classId &&
      ((studentRecord.course &&
        String(studentRecord.course) === p.data.courseId) ||
        studentRecord.courseName === courseRecord.title);
    const enrolled = Boolean(activeEnrollment) || legacyMatch;
    if (!enrolled)
      redirect(
        `${s.user.role === "MANAGER" ? "/manager/performance" : s.user.role === "GUIDE" ? "/guide/kpa" : "/admin/academic-performance"}/new?error=student`,
      );
  }
  await Performance.create({
    student: p.data.studentId,
    course: p.data.courseId,
    class: p.data.classId || null,
    assessment: p.data.assessment,
    score: p.data.score,
    maxScore: p.data.maxScore,
    date: new Date(`${p.data.date}T00:00:00.000Z`),
    notes: p.data.notes,
    recordedBy: s.user.id,
  });
  revalidatePath("/admin/academic-performance");
  revalidatePath("/manager/performance");
  revalidatePath("/guide/kpa");
  revalidatePath("/student/marks");
  revalidatePath("/student/progress");
  revalidatePath("/student/leaderboard");
  redirect(
    `${s.user.role === "MANAGER" ? "/manager/performance" : s.user.role === "GUIDE" ? "/guide/kpa" : "/admin/academic-performance"}?created=1`,
  );
}

export async function submitAssignmentAction(fd: FormData) {
  const s = await requireRole(["STUDENT"]);
  const assignmentId = v(fd, "assignmentId");
  const response = v(fd, "text");
  const suppliedUrl = v(fd, "attachmentUrl");
  const rawFile = fd.get("attachment");
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
  if (
    !/^[a-f\d]{24}$/i.test(assignmentId) ||
    response.length > 5000 ||
    (response.length < 2 && !file && !suppliedUrl)
  )
    redirect("/student/assignments?error=invalid");
  if (
    suppliedUrl &&
    (!/^https:\/\//i.test(suppliedUrl) || suppliedUrl.length > 1000)
  )
    redirect("/student/assignments?error=invalid");
  if (
    file &&
    (file.size > 10 * 1024 * 1024 ||
      ![
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "text/plain",
        "application/zip",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ].includes(file.type))
  )
    redirect("/student/assignments?error=file");
  await connectDB();
  const student = await User.findOne({
    _id: s.user.id,
    role: "STUDENT",
    isActive: true,
  })
    .select("course courseName class")
    .lean();
  const assignment = await Assignment.findOne({
    _id: assignmentId,
    status: "PUBLISHED",
    dueDate: { $gte: new Date() },
  })
    .populate("course", "title")
    .lean();
  const assignmentCourse = assignment?.course as unknown as {
    _id?: unknown;
    title?: string;
  } | null;
  const courseMatches =
    !!student &&
    !!assignment &&
    ((student.course &&
      String(student.course) === String(assignmentCourse?._id)) ||
      (!!student.courseName && assignmentCourse?.title === student.courseName));
  const classMatches =
    !!assignment &&
    (!assignment.class ||
      (student?.class && String(student.class) === String(assignment.class)));
  if (!student || !assignment || !courseMatches || !classMatches)
    redirect("/student/assignments?error=unavailable");
  let attachmentUrl = suppliedUrl;
  if (file) {
    try {
      const safeName =
        file.name
          .normalize("NFKD")
          .replace(/[^a-zA-Z0-9._-]+/g, "-")
          .slice(-100) || "submission-file";
      const blob = await put(
        `assignments/${s.user.id}/${assignmentId}/${Date.now()}-${safeName}`,
        file,
        { access: "public", addRandomSuffix: true },
      );
      attachmentUrl = blob.url;
    } catch (error) {
      console.error("Assignment file upload failed", error);
      redirect("/student/assignments?error=upload");
    }
  }
  const Submission = (await import("@/models/AssignmentSubmission")).default;
  await Submission.findOneAndUpdate(
    { assignment: assignmentId, student: s.user.id },
    {
      $set: {
        text: response,
        attachmentUrl,
        submittedAt: new Date(),
        status: "SUBMITTED",
        feedback: "",
        reviewedBy: null,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
  revalidatePath("/student/assignments");
  revalidatePath("/guide/submissions");
  revalidatePath("/manager/assignments");
  redirect("/student/assignments?submitted=1");
}

export async function reviewSubmissionAction(fd: FormData) {
  const s = await requireRole(["GUIDE"]);
  const submissionId = v(fd, "submissionId");
  const feedback = v(fd, "feedback");
  const scoreRaw = v(fd, "score");
  const score = scoreRaw === "" ? null : Number(scoreRaw);
  if (
    !/^[a-f\d]{24}$/i.test(submissionId) ||
    feedback.length > 2000 ||
    (score !== null && (!Number.isFinite(score) || score < 0 || score > 100))
  )
    redirect("/guide/submissions?error=invalid");
  await connectDB();
  const Submission = (await import("@/models/AssignmentSubmission")).default;
  const submission = await Submission.findById(submissionId)
    .populate({
      path: "assignment",
      populate: [
        { path: "class", select: "guide course" },
        { path: "course", select: "title" },
      ],
    })
    .populate("student", "course courseName class")
    .lean();
  const assignment = submission?.assignment as unknown as {
    class?: { _id?: unknown; guide?: unknown; course?: unknown } | null;
    course?: { _id?: unknown; title?: string } | null;
  } | null;
  const student = submission?.student as unknown as {
    course?: unknown;
    courseName?: string;
    class?: unknown;
  } | null;
  if (!submission || !assignment || !student)
    redirect("/guide/submissions?error=forbidden");
  let allowed = false;
  if (assignment.class) {
    allowed = String(assignment.class.guide || "") === s.user.id;
  } else {
    const assigned = await ClassRecord.find({
      guide: s.user.id,
      course: assignment.course?._id,
    })
      .select("_id")
      .lean();
    allowed =
      assigned.length > 0 &&
      Boolean(
        (student.course &&
          String(student.course) === String(assignment.course?._id)) ||
        student.courseName === assignment.course?.title,
      );
  }
  if (!allowed) redirect("/guide/submissions?error=forbidden");
  await Submission.updateOne(
    { _id: submissionId },
    { $set: { feedback, score, status: "REVIEWED", reviewedBy: s.user.id } },
  );
  revalidatePath("/guide/submissions");
  revalidatePath("/student/assignments");
  revalidatePath("/manager/assignments");
  revalidatePath("/student/leaderboard");
  redirect("/guide/submissions?reviewed=1");
}
