import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import StaffPerformance from "@/models/StaffPerformance";
import StaffAdjustment from "@/models/StaffAdjustment";
import GuideReview from "@/models/GuideReview";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "My Guide Performance | AfghanUstad" };
export default async function Page() {
  const s = await requireRole(["GUIDE"]);
  await connectDB();
  const [user, records, adjustments, quality] = await Promise.all([
    User.findById(s.user.id).select("salaryAmount").lean(),
    StaffPerformance.find({ staff: s.user.id })
      .sort({ date: -1 })
      .limit(300)
      .lean(),
    StaffAdjustment.find({ staff: s.user.id, status: "POSTED" })
      .sort({ effectiveAt: -1 })
      .lean(),
    GuideReview.find({ guide: s.user.id })
      .sort({ reviewDate: -1 })
      .limit(10)
      .lean(),
  ]);
  const net = adjustments.reduce(
    (sum, a) => sum + (a.type === "GIFT" ? a.amount : -a.amount),
    0,
  );
  return (
    <div className="space-y-5">
      <ResourcePage
        eyebrow="My account"
        title="My Performance & Salary"
        description="Review your own KPI, Super Admin quality reviews, monthly base salary, and posted fines or gifts."
        stats={[
          {
            label: "Monthly base salary",
            value: `${(user?.salaryAmount || 0).toLocaleString()} AFN`,
          },
          { label: "KPI records", value: records.length },
          {
            label: "Average KPI",
            value: records.length
              ? `${Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length)}/100`
              : "—",
          },
          { label: "Quality reviews", value: quality.length },
          {
            label: "Adjusted account total",
            value: `${((user?.salaryAmount || 0) + net).toLocaleString()} AFN`,
          },
        ]}
        rows={[
          ...records.map((r) => ({
            title: `${r.category} · ${r.score}/100`,
            detail: r.feedback,
            status: "KPI evaluation",
            meta: new Date(r.date).toLocaleDateString("en-GB"),
          })),
          ...adjustments.map((a) => ({
            title: a.type === "GIFT" ? "Gift / bonus" : "Fine / deduction",
            detail: a.reason,
            status: `${a.type === "GIFT" ? "+" : "−"}${a.amount.toLocaleString()} AFN`,
            meta: new Date(a.effectiveAt).toLocaleDateString("en-GB"),
          })),
          ...quality.map((r) => ({
            title: `Quality review · ${r.category.replace(/_/g, " ")}`,
            detail: r.notes,
            status: `${r.qualityScore}/100`,
            meta: new Date(r.reviewDate).toLocaleDateString("en-GB"),
          })),
        ]}
        empty="No staff KPI or account records have been recorded yet."
      />
    </div>
  );
}
