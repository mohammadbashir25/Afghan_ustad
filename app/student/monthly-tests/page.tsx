import { requireStudent } from "@/lib/student/session";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import MonthlyTest from "@/models/MonthlyTest";
import MonthlyTestAttempt from "@/models/MonthlyTestAttempt";
import { submitMonthlyTestAction } from "./actions";
type MonthlyTestQuestion = {
  prompt: string;
  points: number;
  type: string;
  options: string[];
};
export const metadata = { title: "Monthly Test | AfghanUstad" };
const field =
  "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm";
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
      .select("test autoScore pendingManualPoints")
      .lean(),
  ]);
  const classIds = [
    ...new Set([
      ...enrollments.map((e) => String(e.class || "")).filter(Boolean),
      ...(enrollments.length
        ? []
        : student?.class
          ? [String(student.class)]
          : []),
    ]),
  ];
  const tests = classIds.length
    ? await MonthlyTest.find({ class: { $in: classIds }, status: "OPEN" })
        .populate("class", "name")
        .sort({ testDate: 1 })
        .lean()
    : [];
  const attempts = new Map<
    string,
    { autoScore: number; pendingManualPoints: number }
  >(
    attemptRows.map((a) => [
      String(a.test),
      { autoScore: a.autoScore, pendingManualPoints: a.pendingManualPoints },
    ]),
  );
  const errors: Record<string, string> = {
    invalid: "Please choose a valid test.",
    unavailable:
      "This test is not available for your active class or has not opened yet.",
    "already-submitted": "You have already submitted this test.",
    empty: "Please answer at least one question before submitting.",
  };
  const now = new Date().getTime();
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#0B6B4F]">
          Student learning
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#053B2E]">Monthly Test</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your online academic action is the monthly test. Ongoing tasks are
          completed physically at the Skill Center; your guide records practical
          results and KPI.
        </p>
      </header>
      {params.submitted && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Your test has been submitted. Practical/project answers that need
          review will be checked by your guide.
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
      {tests.map((test) => {
        const attempt = attempts.get(String(test._id));
        const cls = test.class as unknown as { name?: string } | null;
        const open = new Date(test.testDate).getTime() <= now;
        const questions = Array.isArray(test.questions) ? test.questions : [];
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
                {test.instructions && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                    {test.instructions}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${attempt ? "bg-slate-100 text-slate-700" : open ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}
              >
                {attempt ? "Submitted" : open ? "Available" : "Scheduled"}
              </span>
            </div>
            {attempt ? (
              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
                <p className="font-semibold">Submission received</p>
                <p className="mt-1">
                  Auto-graded multiple-choice score: {attempt.autoScore}/100
                </p>
                {attempt.pendingManualPoints > 0 && (
                  <p className="mt-1 text-slate-500">
                    Practical/project answers are pending guide review.
                  </p>
                )}
              </div>
            ) : open ? (
              <form action={submitMonthlyTestAction} className="mt-5 space-y-5">
                <input type="hidden" name="testId" value={String(test._id)} />
                {questions.map((q: MonthlyTestQuestion, i: number) => (
                  <fieldset
                    key={i}
                    className="rounded-lg border border-slate-200 p-4"
                      >
                      <legend className="px-1 text-sm font-semibold">
                        {i + 1}. {q.prompt}{" "}
                        <span className="font-normal text-slate-500">
                          ({q.points} points)
                        </span>
                      </legend>
                      {q.type === "MULTIPLE_CHOICE" ? (
                        <div className="mt-3 space-y-2">
                          {q.options.map((option, j) => (
                            <label
                              key={j}
                              className="flex items-start gap-2 text-sm"
                            >
                              <input
                                type="radio"
                                name={`answer_${i}`}
                                value={j}
                                className="mt-1"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <label className="mt-3 block text-sm">
                          Your practical/project response
                          <textarea
                            name={`answer_${i}`}
                            rows={4}
                            maxLength={5000}
                            className={field}
                            placeholder="Describe your solution or the work you completed."
                          />
                        </label>
                      )}
                    </fieldset>
                  ),
                )}
                <p className="text-xs text-slate-500">
                  Multiple-choice questions are graded automatically. Practical
                  and project responses are sent to your guide for review.
                </p>
                <button className="rounded-lg bg-[#0B6B4F] px-4 py-2.5 text-sm font-semibold text-white">
                  Submit monthly test
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                This test is scheduled. It will be available on the test date.
              </p>
            )}
          </section>
        );
      })}
      {!tests.length && (
        <div className="rounded-xl border border-dashed border-[#DCE7E2] bg-white p-6">
          <h2 className="font-semibold text-[#053B2E]">
            No monthly test available
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your manager will publish the monthly test for your enrolled class.
            When it opens, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
