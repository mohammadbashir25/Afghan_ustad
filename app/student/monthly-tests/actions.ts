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
import MonthlyTestResult from "@/models/MonthlyTestResult";
import Performance from "@/models/Performance";
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
  if (!Array.isArray(test.questions) || test.questions.length < 2 ||
      test.questions.some((question: { type?: string; options?: string[]; correctOption?: number }) =>
        question.type !== "MULTIPLE_CHOICE" ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        !Number.isInteger(question.correctOption)
      )) {
    redirect("/student/monthly-tests?error=invalid");
  }

  const answers: Array<{ questionIndex: number; answer: string }> = [];
  let earned = 0;
  let possible = 0;
  let correctAnswers = 0;

  for (let i = 0; i < test.questions.length; i++) {
    const question = test.questions[i];
    const rawAnswer = String(fd.get(`answer_${i}`) ?? "").trim();
    const selected = Number(rawAnswer);

    if (!rawAnswer || !Number.isInteger(selected) || selected < 0 || selected >= question.options.length) {
      redirect("/student/monthly-tests?error=incomplete");
    }

    answers.push({ questionIndex: i, answer: String(selected) });
    possible += question.points;
    if (selected === question.correctOption) {
      earned += question.points;
      correctAnswers += 1;
    }
  }

  const autoScore = possible > 0
    ? Math.round((earned / possible) * 10000) / 100
    : 0;

  const monthStart = new Date(Date.UTC(test.year, test.month - 1, 1));
  const monthEnd = new Date(Date.UTC(test.year, test.month, 1));
  const skillRows = await Performance.find({
    student: session.user.id,
    course: test.course,
    class: test.class,
    assignment: { $ne: null },
    date: { $gte: monthStart, $lt: monthEnd },
  }).select("score maxScore").lean();
  const skillCenterScore = skillRows.length
    ? Math.round(
        skillRows.reduce((sum, row) => sum + (row.maxScore > 0 ? (row.score / row.maxScore) * 100 : 0), 0) /
        skillRows.length * 100,
      ) / 100
    : 0;
  const overallScore = skillRows.length
    ? test.gradingMode === "MCQ_SKILL_50_50"
      ? Math.round(((autoScore + skillCenterScore) / 2) * 100) / 100
      : Math.round((skillCenterScore * 0.6 + autoScore * 0.4) * 100) / 100
    : autoScore;

  try {
    const attempt = await MonthlyTestAttempt.create({
      test: testId,
      student: session.user.id,
      answers,
      autoScore,
      autoGradedPoints: possible,
      pendingManualPoints: 0,
      status: "REVIEWED",
      submittedAt: new Date(),
    });

    await MonthlyTestResult.findOneAndUpdate(
      { test: testId, student: session.user.id },
      {
        $set: {
          test: testId,
          student: session.user.id,
          practicalScore: skillCenterScore,
          testScore: autoScore,
          finalScore: overallScore,
          practicalEvidence: `${skillRows.length} Skill Center task evaluations recorded for ${test.month}/${test.year}.`,
          feedback: `Automatically graded: ${correctAnswers} of ${test.questions.length} questions correct. Overall monthly score combines exam and Skill Center task average.`,
          recordedBy: session.user.id,
          recordedAt: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    await AuditLog.create({
      actor: session.user.id,
      actorName: session.user.name || "Student",
      action: "MONTHLY_TEST_SUBMITTED",
      targetType: "MonthlyTestAttempt",
      targetId: String(attempt._id),
      details: `Submitted monthly MCQ test ${test.title}. Exam: ${autoScore}/100; Skill Center: ${skillCenterScore}/100; overall: ${overallScore}/100; ${correctAnswers} correct answers.`,
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
