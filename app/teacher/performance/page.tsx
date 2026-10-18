import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import StaffPerformance from "@/models/StaffPerformance";
import StaffAdjustment from "@/models/StaffAdjustment";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "My Performance & Salary | AfghanUstad" };
export default async function Page() {
  const s = await requireRole(["TEACHER"]);
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
      title="My Performance & Salary"
      description="Your base monthly salary plus posted gifts/bonuses and fines/deductions. KPI feedback is recorded by management and remains available here."
      stats={[
        {
          label: "Monthly base salary",
          value: `${(user?.salaryAmount || 0).toLocaleString()} AFN`,
        },
        {
          label: "Gifts / credits",
          value: `${adjustments
            .filter((a) => a.type === "GIFT")
            .reduce((n, a) => n + a.amount, 0)
            .toLocaleString()} AFN`,
        },
        {
          label: "Fines / deductions",
          value: `${adjustments
            .filter((a) => a.type === "FINE")
            .reduce((n, a) => n + a.amount, 0)
            .toLocaleString()} AFN`,
        },
        {
          label: "Adjusted account total",
          value: `${((user?.salaryAmount || 0) + net).toLocaleString()} AFN`,
        },
        { label: "KPI records", value: records.length },
        {
          label: "Average KPI",
          value: records.length
            ? `${Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length)}/100`
            : "—",
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
