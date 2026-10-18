import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import StaffPerformance from "@/models/StaffPerformance";
import StaffAdjustment from "@/models/StaffAdjustment";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "My KPI & Account | AfghanUstad" };
export default async function Page() {
  const s = await requireRole(["STAFF"]);
  await connectDB();
  const [user, records, adjustments] = await Promise.all([
    User.findById(s.user.id).select("salaryAmount").lean(),
    StaffPerformance.find({ staff: s.user.id })
      .sort({ date: -1 })
      .limit(300)
      .lean(),
    StaffAdjustment.find({ staff: s.user.id, status: "POSTED" })
      .sort({ effectiveAt: -1 })
      .lean(),
  ]);
  const net = adjustments.reduce(
    (sum, a) => sum + (a.type === "GIFT" ? a.amount : -a.amount),
    0,
  );
  return (
    <ResourcePage
      eyebrow="My account"
      title="My KPI & Account"
      description="Review your staff KPI evaluations, feedback, base salary, and posted fines or gifts."
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
        {
          label: "Adjusted account total",
          value: `${((user?.salaryAmount || 0) + net).toLocaleString()} AFN`,
        },
      ]}
      rows={records
        .map((r) => ({
          title: `${r.category} · ${r.score}/100`,
          detail: r.feedback,
          status: "KPI recorded",
          meta: new Date(r.date).toLocaleDateString("en-GB"),
        }))
        .concat(
          adjustments.map((a) => ({
            title: a.type === "GIFT" ? "Gift / bonus" : "Fine / deduction",
            detail: a.reason,
            status: `${a.type === "GIFT" ? "+" : "−"}${a.amount.toLocaleString()} AFN`,
            meta: new Date(a.effectiveAt).toLocaleDateString("en-GB"),
          })),
        )}
      empty="No KPI or account adjustments have been recorded yet."
    />
  );
}
