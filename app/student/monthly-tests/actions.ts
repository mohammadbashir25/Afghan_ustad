"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/student/session";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ClassRecord from "@/models/Class";
import Enrollment from "@/models/Enrollment";
import MonthlyTest from "@/models/MonthlyTest";
import MonthlyTestAttempt from "@/models/MonthlyTestAttempt";
import AuditLog from "@/models/AuditLog";
import Performance from "@/models/Performance";
import MonthlyTestResult from "@/models/MonthlyTestResult";
export async function submitMonthlyTestAction(fd: FormData) {
  const session = await requireStudent();
  const testId = String(fd.get("testId") || "");
  if (!/^[a-f\d]{24}$/i.test(testId))
    redirect("/student/monthly-tests?error=invalid");
  await connectDB();
  const [student, test] = await Promise.all([
    User.findOne({ _id: session.user.id, role: "STUDENT", isActive: true })
      .select("course class")
      .lean(),
    MonthlyTest.findOne({ _id: testId, status: "OPEN" }).lean(),
  ]);
  if (!student || !test || new Date(test.testDate).getTime() > Date.now())
    redirect("/student/monthly-tests?error=unavailable");
  const cls = await ClassRecord.findById(test.class).select("course").lean();
  if (!cls) redirect("/student/monthly-tests?error=unavailable");
  const enrolled = await Enrollment.exists({
    student: session.user.id,
    class: test.class,
    status: "ACTIVE",
  });
  const hasEnrollment = await Enrollment.exists({ student: session.user.id });
  const legacyMatch =
    !hasEnrollment &&
    String(student.class || "") === String(test.class) &&
    String(student.course || "") === String(test.course);
  if (!enrolled && !legacyMatch)
    redirect("/student/monthly-tests?error=unavailable");
  if (
    await MonthlyTestAttempt.exists({ test: testId, student: session.user.id })
  )
    redirect("/student/monthly-tests?error=already-submitted");
  const answers: Array<{ questionIndex: number; answer: string }> = [];
  let earned = 0,
    possible = 0,
    pendingManualPoints = 0;
  for (let i = 0; i < test.questions.length; i++) {
    const q = test.questions[i];
    const answer = String(fd.get(`answer_${i}`) || "")
      .trim()
      .slice(0, 5000);
    answers.push({ questionIndex: i, answer });
    if (q.type === "MULTIPLE_CHOICE") {
      possible += q.points;
      if (answer && Number(answer) === q.correctOption) earned += q.points;
    } else pendingManualPoints += q.points;
  }
  if (!answers.some((a) => a.answer))
    redirect("/student/monthly-tests?error=empty");
  const autoScore =
    possible > 0 ? Math.round((earned / possible) * 10000) / 100 : 0;
  try {
    const attempt = await MonthlyTestAttempt.create({
      test: testId,
      student: session.user.id,
      answers,
      autoScore,
      autoGradedPoints: possible,
      pendingManualPoints,
      status: "SUBMITTED",
      submittedAt: new Date(),
    });
    if (pendingManualPoints === 0 && possible > 0) {
      const start = new Date(Date.UTC(test.year, test.month - 1, 1));
      const end = new Date(Date.UTC(test.year, test.month, 1));
      const practicalRows = await Performance.find({
        student: session.user.id,
        course: test.course,
        class: test.class,
        assignment: { $ne: null },
        date: { $gte: start, $lt: end },
      })
        .select("score maxScore")
        .lean();
      if (practicalRows.length) {
        const practicalScore =
          Math.round(
            (practicalRows.reduce(
              (sum, row) =>
                sum + (row.maxScore > 0 ? (row.score / row.maxScore) * 100 : 0),
              0,
            ) /
              practicalRows.length) *
              100,
          ) / 100;
        const finalScore =
          Math.round((practicalScore * 0.6 + autoScore * 0.4) * 100) / 100;
        await MonthlyTestResult.findOneAndUpdate(
          { test: testId, student: session.user.id },
          {
            $set: {
              test: testId,
              student: session.user.id,
              practicalScore,
              testScore: autoScore,
              finalScore,
              practicalEvidence: `${practicalRows.length} recorded Skill Center task evaluations for ${test.month}/${test.year}`,
              feedback:
                "Multiple-choice test auto-graded. Practical score calculated from recorded Skill Center task evaluations.",
              recordedBy: session.user.id,
              recordedAt: new Date(),
            },
          },
          { upsert: true, new: true, runValidators: true },
        );
      }
    }
    await AuditLog.create({
      actor: session.user.id,
      actorName: session.user.name || "Student",
      action: "MONTHLY_TEST_SUBMITTED",
      targetType: "MonthlyTestAttempt",
      targetId: String(attempt._id),
      details: `Submitted monthly test ${test.title}. Automatically graded score: ${autoScore}/100; manual review points: ${pendingManualPoints}.`,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === 11000
    )
      redirect("/student/monthly-tests?error=already-submitted");
    throw error;
  }
  revalidatePath("/student/monthly-tests");
  revalidatePath("/student/marks");
  revalidatePath("/student/leaderboard");
  revalidatePath("/admin/audit-logs");
  redirect("/student/monthly-tests?submitted=1");
}
