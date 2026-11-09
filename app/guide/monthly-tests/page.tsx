import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import MonthlyTest from "@/models/MonthlyTest";
import MonthlyTestAttempt from "@/models/MonthlyTestAttempt";
import MonthlyTestResult from "@/models/MonthlyTestResult";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";

export const metadata = { title: "Monthly Exam Monitoring | AfghanUstad" };

export default async function GuideMonthlyTestsPage() {
  const session = await requireRole(["GUIDE"]);
  await connectDB();
  const classes = await ClassRecord.find({ guide: session.user.id })
    .select("_id name schedule status")
    .lean();
  const activeClassIds = classes
    .filter((cls) => cls.status !== "COMPLETED")
    .map((cls) => cls._id);
  const tests = activeClassIds.length
    ? await MonthlyTest.find({ class: { $in: activeClassIds } })
        .populate("class", "name")
        .sort({ year: -1, month: -1 })
        .lean()
    : [];
  const testIds = tests.map((test) => test._id);
  const [attempts, results] = await Promise.all([
    testIds.length
      ? MonthlyTestAttempt.find({ test: { $in: testIds } })
          .populate("student", "name studentId")
          .sort({ submittedAt: -1 })
          .lean()
      : [],
    testIds.length
      ? MonthlyTestResult.find({ test: { $in: testIds } })
          .populate("student", "name studentId")
          .lean()
      : [],
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Assessment"
        title="Monthly Exam Monitoring"
        description="View submitted MCQ exam records and the official monthly score. Exams are automatically graded; Skill Center task marks are tracked separately in the monthly report."
      />
      {tests.map((test) => {
        const className =
          (test.class as unknown as { name?: string } | null)?.name || "Class";
        const testAttempts = attempts.filter(
          (attempt) => String(attempt.test) === String(test._id),
        );
        const testResults = results.filter(
          (result) => String(result.test) === String(test._id),
        );
        return (
          <section
            key={String(test._id)}
            className="rounded-xl border border-[#DCE7E2] bg-white p-5"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h2 className="font-semibold text-[#053B2E]">{test.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {className} · {test.month}/{test.year} ·{" "}
                  {new Date(test.testDate).toLocaleDateString("en-GB", {
                    timeZone: "UTC",
                  })}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                {testAttempts.length} submissions
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Exam score</th>
                    <th className="p-3">Overall monthly score</th>
                    <th className="p-3">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {testAttempts.map((attempt) => {
                    const person = attempt.student as unknown as {
                      _id?: unknown;
                      name?: string;
                      studentId?: string;
                    } | null;
                    const result = testResults.find(
                      (row) =>
                        String(
                          (row.student as unknown as { _id?: unknown } | null)
                            ?._id || row.student,
                        ) === String(person?._id),
                    );
                    return (
                      <tr key={String(attempt._id)} className="border-t">
                        <td className="p-3 font-medium">
                          {person?.name || "Student"}
                        </td>
                        <td className="p-3">{person?.studentId || "—"}</td>
                        <td className="p-3">
                          {Number(attempt.autoScore || 0).toFixed(1)}%
                        </td>
                        <td className="p-3 font-semibold text-[#0B6B4F]">
                          {result
                            ? `${Number(result.finalScore).toFixed(1)}%`
                            : "Awaiting result"}
                        </td>
                        <td className="p-3">
                          {new Date(attempt.submittedAt).toLocaleString(
                            "en-GB",
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!testAttempts.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-5 text-center text-slate-500"
                      >
                        No students have submitted this exam yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {!tests.length && (
        <p className="rounded-xl border border-dashed bg-white p-6 text-sm text-slate-500">
          No monthly exams are currently assigned to your active classes.
        </p>
      )}
    </div>
  );
}
