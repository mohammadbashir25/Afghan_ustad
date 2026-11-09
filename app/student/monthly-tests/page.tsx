import { requireStudent } from "@/lib/student/session";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import MonthlyTest from "@/models/MonthlyTest";
import MonthlyTestAttempt from "@/models/MonthlyTestAttempt";
import Performance from "@/models/Performance";
import Attendance from "@/models/Attendance";
import { submitMonthlyTestAction } from "./actions";
import MonthlyExamRunner from "@/components/dashboard/MonthlyExamRunner";

type MonthlyTestQuestion = {
  prompt: string;
  points: number;
  type: string;
  options: string[];
  correctOption: number;
};
type SkillTaskRow = {
  _id: unknown;
  assessment: string;
  score: number;
  maxScore: number;
  date: Date;
  assignment?: { title?: string } | null;
};
type MonthlyLearningReport = {
  id: string;
  title: string;
  month: number;
  year: number;
  examScore: number;
  skillAverage: number | null;
  overall: number;
  gradingMode: string;
  tasks: SkillTaskRow[];
  weekly: Array<[number, SkillTaskRow[]]>;
  attendanceDays: number;
  answers: Array<{ questionIndex: number; answer: string }>;
  questions: MonthlyTestQuestion[];
};

export const metadata = { title: "Monthly Test | AfghanUstad" };
const field =
  "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm";

function monthLabel(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function MonthlyTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const session = await requireStudent();
  await connectDB();
  const params = await searchParams;
  const [student, enrollments, attemptRows] = await Promise.all([
    User.findById(session.user.id).select("course class").lean(),
    Enrollment.find({ student: session.user.id, status: "ACTIVE" })
      .select("class course")
      .lean(),
    MonthlyTestAttempt.find({ student: session.user.id })
      .select("test answers autoScore pendingManualPoints submittedAt")
      .lean(),
  ]);

  const classIds = [
    ...new Set([
      ...enrollments
        .map((enrollment) => String(enrollment.class || ""))
        .filter(Boolean),
      ...(enrollments.length
        ? []
        : student?.class
          ? [String(student.class)]
          : []),
    ]),
  ];

  const tests = classIds.length
    ? await MonthlyTest.find({
        class: { $in: classIds },
        status: { $in: ["OPEN", "COMPLETED"] },
      })
        .populate("class", "name")
        .sort({ year: -1, month: -1, testDate: 1 })
        .lean()
    : [];

  const attempts = new Map<
    string,
    {
      autoScore: number;
      answers: Array<{ questionIndex: number; answer: string }>;
    }
  >(
    (
      attemptRows as unknown as Array<{
        test: unknown;
        autoScore: number;
        answers: Array<{ questionIndex: number; answer: string }>;
      }>
    ).map((attempt) => [
      String(attempt.test),
      {
        autoScore: Number(attempt.autoScore || 0),
        answers: Array.isArray(attempt.answers) ? attempt.answers : [],
      },
    ]),
  );
  const errors: Record<string, string> = {
    invalid:
      "This test has an invalid or unsupported question format. Please contact your manager.",
    unavailable:
      "This test is not available for your active class or has not opened yet.",
    "already-submitted": "You have already submitted this test.",
    empty: "Please answer the questions before submitting.",
    incomplete: "Please select an answer for every question before submitting.",
  };

  const reports: MonthlyLearningReport[] = await Promise.all(
    tests
      .filter((test) => attempts.has(String(test._id)))
      .map(async (test) => {
        const start = new Date(Date.UTC(test.year, test.month - 1, 1));
        const end = new Date(Date.UTC(test.year, test.month, 1));
        const [skillRows, attendanceRows] = await Promise.all([
          Performance.find({
            student: session.user.id,
            class: test.class,
            course: test.course,
            assignment: { $ne: null },
            date: { $gte: start, $lt: end },
          })
            .populate("assignment", "title")
            .sort({ date: 1 })
            .lean(),
          Attendance.find({
            student: session.user.id,
            class: test.class,
            date: { $gte: start, $lt: end },
          })
            .select("date status")
            .lean(),
        ]);

        const taskRows = skillRows as unknown as SkillTaskRow[];
        const weekly = new Map<number, SkillTaskRow[]>();
        for (const row of taskRows) {
          const week = Math.ceil(new Date(row.date).getUTCDate() / 7);
          weekly.set(week, [...(weekly.get(week) || []), row]);
        }
        const taskScores = taskRows.map((row) =>
          row.maxScore > 0 ? (row.score / row.maxScore) * 100 : 0,
        );
        const skillAverage = taskScores.length
          ? taskScores.reduce((sum, score) => sum + score, 0) /
            taskScores.length
          : null;
        const attempt = attempts.get(String(test._id))!;
        const examScore = Number(attempt.autoScore || 0);
        const overall =
          skillAverage === null
            ? examScore
            : test.gradingMode === "MCQ_SKILL_50_50"
              ? (examScore + skillAverage) / 2
              : skillAverage * 0.6 + examScore * 0.4;

        return {
          id: String(test._id),
          title: test.title,
          month: test.month,
          year: test.year,
          examScore,
          skillAverage,
          overall: Math.round(overall * 100) / 100,
          gradingMode: test.gradingMode || "LEGACY_PRACTICAL_60_40",
          tasks: taskRows,
          weekly: [...weekly.entries()].sort((a, b) => a[0] - b[0]),
          attendanceDays: new Set(
            attendanceRows.map((row) =>
              new Date(row.date).toISOString().slice(0, 10),
            ),
          ).size,
          answers: attempt.answers as Array<{
            questionIndex: number;
            answer: string;
          }>,
          questions: test.questions as unknown as MonthlyTestQuestion[],
        };
      }),
  );

  const now = Date.now();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#0B6B4F]">
          Student learning
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#053B2E]">
          Monthly Examination & Learning Report
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Complete your monthly exam online using multiple-choice questions.
          After submission, review your exam result together with your weekly
          Skill Center task marks and monthly learning progress.
        </p>
      </header>

      {params.submitted && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Your exam was submitted and graded. Your monthly learning report is
          now available below.
        </p>
      )}
      {params.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {errors[params.error] || "Something went wrong. Please try again."}
        </p>
      )}

      {reports.map((report) => (
        <section
          key={report.id}
          className="space-y-4 rounded-2xl border border-[#DCE7E2] bg-white p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0B6B4F]">
                Monthly learning report
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#053B2E]">
                {report.title}
              </h2>
              <p className="text-sm text-slate-500">
                {monthLabel(report.month, report.year)}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              Exam submitted
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Monthly exam"
              value={`${report.examScore.toFixed(1)}%`}
            />
            <Metric
              label="Skill Center average"
              value={
                report.skillAverage === null
                  ? "No marks yet"
                  : `${report.skillAverage.toFixed(1)}%`
              }
            />
            <Metric
              label="Overall monthly score"
              value={`${report.overall.toFixed(1)}%`}
              highlight
            />
            <Metric
              label="Attendance days recorded"
              value={String(report.attendanceDays)}
            />
          </div>
          <p className="text-xs text-slate-500">
            {report.gradingMode === "MCQ_SKILL_50_50"
              ? "Overall score is the average of the monthly exam and the average of recorded Skill Center task marks (50% each)."
              : "This historical test retains its original 60% Skill Center / practical and 40% exam formula."}{" "}
            If no Skill Center marks are recorded, the exam score is shown as
            the overall score. Attendance is shown as recorded days; exact study
            hours are not calculated because class check-in/check-out durations
            are not currently stored.
          </p>

          <div className="space-y-3">
            <h3 className="font-semibold text-[#053B2E]">
              Weekly Skill Center tasks & marks
            </h3>
            {report.weekly.length ? (
              report.weekly.map(([week, rows]) => {
                const average =
                  rows.reduce(
                    (sum, row) =>
                      sum +
                      (row.maxScore > 0 ? (row.score / row.maxScore) * 100 : 0),
                    0,
                  ) / rows.length;
                return (
                  <div
                    key={week}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <h4 className="font-semibold">Week {week}</h4>
                      <span className="text-sm font-semibold text-[#0B6B4F]">
                        Average: {average.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-3 divide-y">
                      {rows.map((row) => (
                        <div
                          key={String(row._id)}
                          className="flex flex-wrap justify-between gap-2 py-2 text-sm"
                        >
                          <span>{row.assignment?.title || row.assessment}</span>
                          <span className="font-semibold">
                            {row.score}/{row.maxScore} (
                            {((row.score / row.maxScore) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                No Skill Center task marks have been recorded for this month
                yet.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-[#053B2E]">Exam answer record</h3>
            {report.questions.map((question, index) => {
              const answer = report.answers.find(
                (item) => item.questionIndex === index,
              )?.answer;
              const selected = answer === undefined ? -1 : Number(answer);
              const correct = selected === question.correctOption;
              return (
                <div key={index} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-medium">
                    {index + 1}. {question.prompt}
                  </p>
                  {question.type === "MULTIPLE_CHOICE" ? (
                    <p
                      className={`mt-1 ${correct ? "text-emerald-700" : "text-red-700"}`}
                    >
                      Your answer:{" "}
                      {question.options[selected] || "Not answered"} ·{" "}
                      {correct
                        ? "Correct"
                        : `Correct answer: ${question.options[question.correctOption] || "Not available"}`}
                    </p>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-slate-600">
                      Historical response:{" "}
                      {report.answers.find(
                        (item) => item.questionIndex === index,
                      )?.answer || "No response recorded"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {tests
        .filter((test) => !attempts.has(String(test._id)))
        .map((test) => {
          const cls = test.class as unknown as { name?: string } | null;
          const available =
            new Date(test.testDate).getTime() <= now && test.status === "OPEN";
          const questions = (Array.isArray(test.questions)
            ? test.questions
            : []) as unknown as MonthlyTestQuestion[];
          const mcqOnly =
            questions.length >= 2 &&
            questions.every(
              (question) =>
                question.type === "MULTIPLE_CHOICE" &&
                Array.isArray(question.options) &&
                question.options.length === 4,
            );
          return (
            <section
              key={String(test._id)}
              className="rounded-xl border border-[#DCE7E2] bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#053B2E]">
                    {test.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {cls?.name || "Assigned class"} ·{" "}
                    {new Date(test.testDate).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${available ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}
                >
                  {available ? "Available" : "Scheduled / Closed"}
                </span>
              </div>
              {test.instructions && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                  {test.instructions}
                </p>
              )}
              {!mcqOnly ? (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  This is an older test format and includes unsupported
                  practical or upload questions. Please contact your manager to
                  publish a new MCQ-only test.
                </p>
              ) : available ? (
                <MonthlyExamRunner
                  testId={String(test._id)}
                  title={test.title}
                  questions={questions.map((question) => ({
                    prompt: question.prompt,
                    points: question.points,
                    options: question.options,
                  }))}
                  action={submitMonthlyTestAction}
                />
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  This exam is not open yet or has been closed.
                </p>
              )}
            </section>
          );
        })}

      {!tests.length && (
        <div className="rounded-xl border border-dashed border-[#DCE7E2] bg-white p-6">
          <h2 className="font-semibold text-[#053B2E]">
            No monthly exam available
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your manager will publish an MCQ exam for your enrolled class.
          </p>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 ${highlight ? "bg-[#E6F4EE]" : "bg-slate-50"}`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${highlight ? "text-[#0B6B4F]" : "text-[#053B2E]"}`}
      >
        {value}
      </p>
    </div>
  );
}
