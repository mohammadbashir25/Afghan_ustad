"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import MonthlyTest from "@/models/MonthlyTest";
import MonthlyTestResult from "@/models/MonthlyTestResult";
import Performance from "@/models/Performance";
import User from "@/models/User";
import Course from "@/models/Course";
import AuditLog from "@/models/AuditLog";
const val = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
export async function createMonthlyTestAction(fd: FormData) {
  const s = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base =
    s.user.role === "MANAGER"
      ? "/manager/monthly-tests"
      : "/admin/monthly-tests";
  const title = val(fd, "title"),
    classId = val(fd, "classId"),
    month = Number(val(fd, "month")),
    year = Number(val(fd, "year")),
    dateText = val(fd, "testDate"),
    instructions = val(fd, "instructions");
  let questions: Array<{
    prompt: string;
    type: "MULTIPLE_CHOICE" | "PRACTICAL" | "PROJECT_UPLOAD";
    options: string[];
    correctOption: number;
    points: number;
  }> = [];
  let practicalTasks: Array<{
    title: string;
    instructions: string;
    points: number;
    requiresUpload: boolean;
  }> = [];
  try {
    questions = JSON.parse(val(fd, "questionsJson") || "[]");
    practicalTasks = JSON.parse(val(fd, "practicalTasksJson") || "[]");
  } catch {
    redirect(`${base}?error=invalid`);
  }
  const validQuestionTypes = new Set([
    "MULTIPLE_CHOICE",
    "PRACTICAL",
    "PROJECT_UPLOAD",
  ]);
  if (
    !Array.isArray(questions) ||
    questions.length < 2 ||
    questions.length > 50 ||
    questions.some(
      (q) =>
        !q ||
        typeof q.prompt !== "string" ||
        q.prompt.trim().length < 2 ||
        !validQuestionTypes.has(q.type) ||
        !Number.isFinite(q.points) ||
        q.points < 1 ||
        q.points > 100 ||
        (q.type === "MULTIPLE_CHOICE" &&
          (!Array.isArray(q.options) ||
            q.options.length !== 4 ||
            q.options.some((o) => typeof o !== "string" || !o.trim()) ||
            !Number.isInteger(q.correctOption) ||
            q.correctOption < 0 ||
            q.correctOption > 3)),
    )
  )
    redirect(`${base}?error=questions`);
  if (
    !Array.isArray(practicalTasks) ||
    practicalTasks.length < 1 ||
    practicalTasks.length > 30 ||
    practicalTasks.some(
      (t) =>
        !t ||
        typeof t.title !== "string" ||
        t.title.trim().length < 2 ||
        typeof t.instructions !== "string" ||
        t.instructions.trim().length < 3 ||
        !Number.isFinite(t.points) ||
        t.points < 1 ||
        t.points > 100 ||
        typeof t.requiresUpload !== "boolean",
    )
  )
    redirect(`${base}?error=tasks`);
  if (
    title.length < 2 ||
    title.length > 160 ||
    !/^[a-f\d]{24}$/i.test(classId) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    year < 2020 ||
    year > 2200 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateText) ||
    instructions.length > 3000
  )
    redirect(`${base}?error=invalid`);
  if (
    Number(dateText.slice(5, 7)) !== month ||
    Number(dateText.slice(0, 4)) !== year
  )
    redirect(`${base}?error=invalid`);
  await connectDB();
  const cls = await ClassRecord.findById(classId).select("course guide").lean();
  if (!cls) redirect(`${base}?error=class`);
  if (s.user.role === "MANAGER" && !cls) redirect(`${base}?error=class`);
  try {
    const test = await MonthlyTest.create({
      title,
      class: classId,
      course: cls.course,
      month,
      year,
      testDate: new Date(`${dateText}T00:00:00.000Z`),
      maxScore: 100,
      instructions,
      questions,
      practicalTasks,
      status: "OPEN",
      createdBy: s.user.id,
    });
    await AuditLog.create({
      actor: s.user.id,
      actorName: s.user.name || s.user.email || "Staff",
      action: "MONTHLY_TEST_CREATED",
      targetType: "MonthlyTest",
      targetId: String(test._id),
      details: `${title} for ${month}/${year}.`,
    });
  } catch (e) {
    if (typeof e === "object" && e && "code" in e && e.code === 11000)
      redirect(`${base}?error=duplicate`);
    throw e;
  }
  revalidatePath(base);
  revalidatePath("/guide/monthly-tests");
  redirect(`${base}?created=1`);
}
export async function recordMonthlyTestResultAction(fd: FormData) {
  const s = await requireRole(["SUPER_ADMIN", "MANAGER", "GUIDE"]);
  const base =
    s.user.role === "GUIDE"
      ? "/guide/monthly-tests"
      : s.user.role === "MANAGER"
        ? "/manager/monthly-tests"
        : "/admin/monthly-tests";
  const testId = val(fd, "testId"),
    studentId = val(fd, "studentId"),
    testScore = Number(val(fd, "testScore")),
    feedback = val(fd, "feedback");
  if (
    !/^[a-f\d]{24}$/i.test(testId) ||
    !/^[a-f\d]{24}$/i.test(studentId) ||
    !Number.isFinite(testScore) ||
    testScore < 0 ||
    testScore > 100 ||
    feedback.length > 2000
  )
    redirect(`${base}?error=invalid`);
  await connectDB();
  const test = await MonthlyTest.findById(testId).lean();
  if (!test) redirect(`${base}?error=test`);
  const cls = await ClassRecord.findById(test.class)
    .select("guide course")
    .lean();
  if (!cls) redirect(`${base}?error=class`);
  if (s.user.role === "GUIDE" && String(cls.guide) !== s.user.id)
    redirect("/login");
  const student = await User.findOne({
    _id: studentId,
    role: "STUDENT",
    isActive: true,
  })
    .select("course courseName class")
    .lean();
  const courseRecord = await Course.findById(test.course)
    .select("title")
    .lean();
  if (!student || !courseRecord) redirect(`${base}?error=student`);
  const Enrollment = (await import("@/models/Enrollment")).default;
  const activeEnrollment = await Enrollment.exists({
    student: studentId,
    course: test.course,
    class: test.class,
    status: "ACTIVE",
  });
  const hasAnyEnrollment = await Enrollment.exists({ student: studentId });
  const legacyMatch =
    !hasAnyEnrollment &&
    String(student.class || "") === String(test.class) &&
    ((student.course && String(student.course) === String(test.course)) ||
      (!student.course && student.courseName === courseRecord.title));
  if (!activeEnrollment && !legacyMatch) redirect(`${base}?error=student`);
  const start = new Date(Date.UTC(test.year, test.month - 1, 1));
  const end = new Date(Date.UTC(test.year, test.month, 1));
  const performanceRows = await Performance.find({
    student: studentId,
    course: test.course,
    class: test.class,
    assignment: { $ne: null },
    date: { $gte: start, $lt: end },
  })
    .select("score maxScore")
    .lean();
  const evidence = performanceRows.map((x) =>
    x.maxScore > 0 ? (x.score / x.maxScore) * 100 : 0,
  );
  if (!evidence.length) redirect(`${base}?error=no-practical`);
  const practicalScore =
    Math.round(
      (evidence.reduce((sum, x) => sum + x, 0) / evidence.length) * 100,
    ) / 100;
  const finalScore =
    Math.round((practicalScore * 0.6 + testScore * 0.4) * 100) / 100;
  await MonthlyTestResult.findOneAndUpdate(
    { test: testId, student: studentId },
    {
      $set: {
        test: testId,
        student: studentId,
        practicalScore,
        testScore,
        finalScore,
        practicalEvidence: `${performanceRows.length} manager-assigned Skill Center tasks for ${test.month}/${test.year}`,
        feedback,
        recordedBy: s.user.id,
        recordedAt: new Date(),
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
  const MonthlyTestAttempt = (await import("@/models/MonthlyTestAttempt"))
    .default;
  await MonthlyTestAttempt.updateOne(
    { test: testId, student: studentId },
    { $set: { status: "REVIEWED" } },
  );
  await AuditLog.create({
    actor: s.user.id,
    actorName: s.user.name || s.user.email || "Staff",
    action: "MONTHLY_TEST_RESULT_RECORDED",
    targetType: "MonthlyTestResult",
    targetId: `${testId}:${studentId}`,
    details: `Monthly result: practical ${practicalScore}, test ${testScore}, final ${finalScore}.`,
  });
  revalidatePath(base);
  revalidatePath("/student/leaderboard");
  revalidatePath("/student/progress");
  revalidatePath("/student/marks");
  redirect(`${base}?saved=1`);
}
