import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ClassRecord from "@/models/Class";
import Attendance from "@/models/Attendance";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import GuideReview from "@/models/GuideReview";
import {
  recordGuideReviewAction,
  deactivateLowPerformingGuideAction,
} from "./../guide-performance-actions";
export const metadata = { title: "Guide Performance | AfghanUstad" };
const field =
  "mt-1 w-full rounded-lg border border-[#DCE7E2] px-3 py-2 text-sm";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    reviewed?: string;
    deactivated?: string;
    error?: string;
  }>;
}) {
  await requireRole(["SUPER_ADMIN"]);
  await connectDB();
  const [guides, params] = await Promise.all([
    User.find({ role: "GUIDE" })
      .select("name email isActive")
      .sort({ name: 1 })
      .lean(),
    searchParams,
  ]);
  const rows = await Promise.all(
    guides.map(async (g) => {
      const [reviews, classes, attendance, reviewsCount] = await Promise.all([
        GuideReview.find({ guide: g._id })
          .sort({ reviewDate: -1 })
          .limit(5)
          .lean(),
        ClassRecord.countDocuments({ guide: g._id }),
        Attendance.countDocuments({ markedBy: g._id }),
        AssignmentSubmission.countDocuments({ reviewedBy: g._id }),
      ]);
      return {
        guide: g,
        reviews,
        classes,
        attendance,
        reviewsCount,
        average: reviews.length
          ? reviews.reduce((n, r) => n + r.qualityScore, 0) / reviews.length
          : null,
        lastTwoLow:
          reviews.length >= 2 &&
          reviews.slice(0, 2).every((r) => r.qualityScore < 60),
      };
    }),
  );
  const err =
    params.error === "threshold"
      ? "Deactivation requires two latest recorded quality reviews below 60/100."
      : params.error === "reason"
        ? "Provide a clear reason of at least 10 characters."
        : "Please check the review details.";
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#0B6B4F]">
          Quality assurance
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#053B2E]">
          Guide performance
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Review workload and teaching quality. Low scores trigger improvement
          planning; deactivation requires two consecutive latest reviews below
          60/100 and a documented reason.
        </p>
      </header>
      {params.reviewed && (
        <p className="rounded-lg bg-[#E6F4EE] p-3 text-sm">
          Guide review saved.
        </p>
      )}
      {params.deactivated && (
        <p className="rounded-lg bg-[#E6F4EE] p-3 text-sm">
          Guide account deactivated and audit-logged.
        </p>
      )}
      {params.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {err}
        </p>
      )}
      {rows.map(
        ({
          guide,
          reviews,
          classes,
          attendance,
          reviewsCount,
          average,
          lastTwoLow,
        }) => (
          <section
            key={String(guide._id)}
            className="rounded-xl border border-[#DCE7E2] bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-[#053B2E]">{guide.name}</h2>
                <p className="text-sm text-slate-500">
                  {guide.email} ·{" "}
                  {guide.isActive ? "Active account" : "Inactive account"}
                </p>
                <p className="mt-2 text-sm">
                  {classes} assigned classes · {attendance} attendance records ·{" "}
                  {reviewsCount} assignment reviews
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-right">
                <p className="text-xs text-slate-500">Recent quality average</p>
                <p
                  className={`text-xl font-bold ${average !== null && average < 60 ? "text-red-700" : "text-[#0B6B4F]"}`}
                >
                  {average === null
                    ? "Not reviewed"
                    : `${average.toFixed(1)}/100`}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <form
                action={recordGuideReviewAction}
                className="space-y-3 rounded-lg border p-4"
              >
                <h3 className="font-semibold">Record quality review</h3>
                <input type="hidden" name="guideId" value={String(guide._id)} />
                <label className="block text-sm">
                  Category
                  <select name="category" className={field}>
                    <option value="OVERALL">Overall quality</option>
                    <option value="TEACHING_QUALITY">Teaching quality</option>
                    <option value="STUDENT_PROGRESS">Student progress</option>
                    <option value="RELIABILITY">Reliability</option>
                    <option value="PROFESSIONALISM">Professionalism</option>
                  </select>
                </label>
                <label className="block text-sm">
                  Score (0–100)
                  <input
                    name="qualityScore"
                    type="number"
                    min="0"
                    max="100"
                    required
                    className={field}
                  />
                </label>
                <label className="block text-sm">
                  Evidence / notes
                  <textarea
                    name="notes"
                    minLength={3}
                    maxLength={2000}
                    required
                    rows={2}
                    className={field}
                  />
                </label>
                <label className="block text-sm">
                  Improvement plan
                  <textarea
                    name="improvementPlan"
                    maxLength={2000}
                    rows={2}
                    className={field}
                    placeholder="Targets, coaching, review date…"
                  />
                </label>
                <button className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">
                  Save review
                </button>
              </form>
              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">Recent reviews</h3>
                {reviews.map((r) => (
                  <div
                    key={String(r._id)}
                    className="border-b pb-2 last:border-0"
                  >
                    <div className="flex justify-between gap-3">
                      <span className="text-sm font-medium">
                        {r.category.replace(/_/g, " ")}
                      </span>
                      <strong
                        className={
                          r.qualityScore < 60
                            ? "text-red-700"
                            : "text-[#0B6B4F]"
                        }
                      >
                        {r.qualityScore}/100
                      </strong>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{r.notes}</p>
                    {r.improvementPlan && (
                      <p className="mt-1 text-xs text-slate-500">
                        Plan: {r.improvementPlan}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(r.reviewDate).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                ))}
                {!reviews.length && (
                  <p className="text-sm text-slate-500">
                    No quality reviews recorded yet.
                  </p>
                )}
                {lastTwoLow && guide.isActive && (
                  <form
                    action={deactivateLowPerformingGuideAction}
                    className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3"
                  >
                    <p className="text-sm font-semibold text-red-800">
                      Repeated low performance
                    </p>
                    <p className="mt-1 text-xs text-red-700">
                      Both latest reviews are below 60/100. Deactivation is a
                      Super Admin decision and requires a documented reason.
                    </p>
                    <input
                      type="hidden"
                      name="guideId"
                      value={String(guide._id)}
                    />
                    <label className="mt-2 block text-sm text-red-900">
                      Reason
                      <textarea
                        name="reason"
                        required
                        minLength={10}
                        maxLength={1000}
                        rows={2}
                        className={field}
                      />
                    </label>
                    <button className="mt-2 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white">
                      Deactivate guide account
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        ),
      )}
    </div>
  );
}
