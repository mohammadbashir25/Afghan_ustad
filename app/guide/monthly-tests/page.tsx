import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import MonthlyTest from "@/models/MonthlyTest";
import MonthlyTestResult from "@/models/MonthlyTestResult";
import MonthlyTestAttempt from "@/models/MonthlyTestAttempt";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import { recordMonthlyTestResultAction } from "@/app/admin/monthly-test-actions";
export const metadata = { title: "Monthly Class Tests | AfghanUstad" };
type MonthlyTestAnswer = {
  questionIndex: number;
  answer?: string;
};

type MonthlyTestQuestion = {
  prompt: string;
};
const field =
  "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm";
export default async function GuideMonthlyTests({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const s = await requireRole(["GUIDE"]);
  await connectDB();
  const [classes, params] = await Promise.all([
    ClassRecord.find({ guide: s.user.id })
      .select("_id name course")
      .populate("course", "title")
      .lean(),
    searchParams,
  ]);
  const ids = classes.map((c) => c._id);
  const tests = ids.length
    ? await MonthlyTest.find({ class: { $in: ids } })
        .populate("class", "name")
        .populate("course", "title")
        .sort({ year: -1, month: -1 })
        .lean()
    : [];
  const [results, attempts, enrollments] = await Promise.all([
    MonthlyTestResult.find({ test: { $in: tests.map((t) => t._id) } })
      .populate("student", "name studentId")
      .lean(),
    MonthlyTestAttempt.find({ test: { $in: tests.map((t) => t._id) } })
      .populate("student", "name studentId")
      .sort({ submittedAt: -1 })
      .lean(),
    Enrollment.find({ class: { $in: ids }, status: "ACTIVE" })
      .select("student class")
      .lean(),
  ]);
  const rosters = new Map<
    string,
    Array<{ _id: unknown; name: string; studentId?: string }>
  >();
  for (const test of tests) {
    const classId = String(
      (test.class as unknown as { _id?: unknown } | null)?._id || test.class,
    );
    const enrollmentIds = enrollments
      .filter((e) => String(e.class) === classId)
      .map((e) => String(e.student));
    const legacy = await User.find({
      role: "STUDENT",
      isActive: true,
      $or: [{ class: test.class }, { class: null, course: test.course }],
    })
      .select("_id")
      .lean();
    const anyEnrollmentRows = await Enrollment.find({
      student: { $in: legacy.map((x) => x._id) },
    })
      .select("student")
      .lean();
    const alreadyEnrolled = new Set(
      anyEnrollmentRows.map((x) => String(x.student)),
    );
    const studentIds = [
      ...new Set([
        ...enrollmentIds,
        ...legacy
          .filter((x) => !alreadyEnrolled.has(String(x._id)))
          .map((x) => String(x._id)),
      ]),
    ];
    const roster = studentIds.length
      ? await User.find({
          _id: { $in: studentIds },
          role: "STUDENT",
          isActive: true,
        })
          .select("name studentId class course courseName")
          .sort({ name: 1 })
          .lean()
      : [];
    rosters.set(
      String(test._id),
      roster as unknown as Array<{
        _id: unknown;
        name: string;
        studentId?: string;
      }>,
    );
  }
  const errors: Record<string, string> = {
    "no-practical":
      "No practical task evaluations were found for this student in the test month. Score ongoing tasks first, then record the monthly test result.",
    student: "Student is not actively enrolled in this class.",
    class: "Class unavailable.",
    invalid: "Please check the score and feedback fields.",
  };
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#0B6B4F]">Assessment</p>
        <h1 className="mt-1 text-2xl font-bold text-[#053B2E]">
          Monthly class tests
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Students take the monthly test in their dashboard. Multiple-choice
          questions are auto-graded; practical/project answers need guide
          review. The final monthly evaluation is ongoing-task average (60%)
          plus monthly test score (40%).
        </p>
      </header>
      {params.saved && (
        <p className="rounded-lg bg-[#E6F4EE] p-3 text-sm">Result saved.</p>
      )}
      {params.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {errors[params.error] || "Please check the test result details."}
        </p>
      )}
      {tests.map((test) => {
        const classStudents = rosters.get(String(test._id)) || [];
        return (
          <section
            key={String(test._id)}
            className="rounded-xl border border-[#DCE7E2] bg-white p-5"
          >
            <h2 className="font-semibold text-[#053B2E]">{test.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {(test.class as unknown as { name?: string } | null)?.name ||
                "Class"}{" "}
              ·{" "}
              {new Date(test.testDate).toLocaleDateString("en-GB", {
                timeZone: "UTC",
              })}{" "}
              · {test.month}/{test.year}
            </p>
            <div className="mt-4 space-y-3">
              {attempts
                .filter(
                  (a) =>
                    String(a.test) === String(test._id) &&
                    a.status !== "REVIEWED",
                )
                .map((a) => {
                  const person = a.student as unknown as {
                    name?: string;
                    studentId?: string;
                  } | null;
                  return (
                    <article
                      key={String(a._id)}
                      className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                    >
                      <p className="font-semibold text-amber-950">
                        Student test submission: {person?.name || "Student"} ·{" "}
                        {person?.studentId || "No ID"}
                      </p>
                      <p className="mt-1 text-xs text-amber-900">
                        Auto-graded multiple-choice score: {a.autoScore}/100 ·
                        Manual review points: {a.pendingManualPoints}
                      </p>
                      <div className="mt-3 space-y-2">
                        {(a.answers as unknown as MonthlyTestAnswer[]).map(
                          (answer: MonthlyTestAnswer) => {
                            const questions =
                              test.questions as unknown as MonthlyTestQuestion[];

                            const q = questions[answer.questionIndex];
                            return (
                              <div
                                key={answer.questionIndex}
                                className="rounded bg-white/80 p-2 text-sm"
                              >
                                <p className="font-medium">
                                  {q?.prompt ||
                                    `Question ${answer.questionIndex + 1}`}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-slate-600">
                                  Answer: {answer.answer || "No answer"}
                                </p>
                              </div>
                            );
                          },
                        )}
                      </div>
                      <p className="mt-2 text-xs text-amber-900">
                        Use the score form below to record the official monthly
                        test score after reviewing any manual answers.
                      </p>
                    </article>
                  );
                })}
              {classStudents.map((st) => {
                const existing = results.find(
                  (r) =>
                    String(
                      (r.student as unknown as { _id?: unknown } | null)?._id ||
                        r.student,
                    ) === String(st._id) && String(r.test) === String(test._id),
                );
                return (
                  <form
                    key={String(st._id)}
                    action={recordMonthlyTestResultAction}
                    className="grid gap-3 rounded-lg border border-slate-100 p-3 sm:grid-cols-[1fr_120px_1fr_auto] sm:items-end"
                  >
                    <input
                      type="hidden"
                      name="testId"
                      value={String(test._id)}
                    />
                    <input
                      type="hidden"
                      name="studentId"
                      value={String(st._id)}
                    />
                    <div>
                      <p className="font-medium">{st.name}</p>
                      <p className="text-xs text-slate-500">
                        {st.studentId || "No student ID"}
                      </p>
                    </div>
                    <label className="text-sm">
                      Test score / 100
                      <input
                        name="testScore"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        required
                        defaultValue={
                          existing?.testScore ??
                          attempts.find(
                            (a) =>
                              String(a.test) === String(test._id) &&
                              String(
                                (
                                  a.student as unknown as {
                                    _id?: unknown;
                                  } | null
                                )?._id || a.student,
                              ) === String(st._id),
                          )?.autoScore ??
                          ""
                        }
                        className={field}
                      />
                    </label>
                    <label className="text-sm">
                      Feedback
                      <input
                        name="feedback"
                        maxLength={2000}
                        defaultValue={existing?.feedback || ""}
                        className={field}
                        placeholder="Optional feedback"
                      />
                    </label>
                    <button className="rounded-lg bg-[#0B6B4F] px-3 py-2 text-sm font-semibold text-white">
                      Save score
                    </button>
                    {existing && (
                      <p className="text-xs text-[#0B6B4F] sm:col-span-4">
                        Ongoing tasks: {existing.practicalScore.toFixed(1)} ·
                        Final monthly score:{" "}
                        <strong>{existing.finalScore.toFixed(1)}/100</strong>
                      </p>
                    )}
                  </form>
                );
              })}
              {!classStudents.length && (
                <p className="text-sm text-slate-500">
                  No active enrollments found for this class.
                </p>
              )}
            </div>
          </section>
        );
      })}
      {!tests.length && (
        <p className="rounded-xl border border-dashed p-6 text-sm text-slate-500">
          No monthly tests for your assigned classes yet. Ask the Manager or
          Super Admin to schedule them.
        </p>
      )}
    </div>
  );
}
