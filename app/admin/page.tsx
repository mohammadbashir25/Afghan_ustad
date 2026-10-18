import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import ClassRecord from "@/models/Class";
import Payment from "@/models/Payment";
import AuditLog from "@/models/AuditLog";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "Super Admin Overview | AfghanUstad" };
export default async function AdminOverviewPage() {
  await requireRole(["SUPER_ADMIN"]);
  await connectDB();
  const [
    students,
    activeStudents,
    courses,
    staff,
    payments,
    activity,
    studentRecords,
  ] = await Promise.all([
    User.countDocuments({ role: "STUDENT" }),
    User.countDocuments({ role: "STUDENT", isActive: true }),
    Course.countDocuments({ status: "ACTIVE" }),
    User.countDocuments({ role: { $in: ["SUPER_ADMIN", "MANAGER", "GUIDE"] } }),
    Payment.find()
      .select("student courseName amountPaid balanceAfterPayment paidAt")
      .sort({ paidAt: -1 })
      .lean(),
    AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
    User.find({ role: "STUDENT" }).select("_id courseName courseFee").lean(),
  ]);
  const income = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const latestBalance = new Map<string, number>();
  for (const p of payments) {
    const key = String(p.student);
    if (!latestBalance.has(key)) latestBalance.set(key, p.balanceAfterPayment);
  }
  const outstanding = studentRecords.reduce(
    (sum, s) =>
      sum +
      (latestBalance.has(String(s._id))
        ? latestBalance.get(String(s._id)) || 0
        : s.courseFee || 0),
    0,
  );
  const classes = await ClassRecord.countDocuments({
    status: { $in: ["ACTIVE", "UPCOMING"] },
  });
  return (
    <div className="space-y-6">
      <ResourcePage
        eyebrow="Overview"
        title="Super Admin Dashboard"
        description="System-wide view of academy operations, enrolment, finance, and recent audited activity."
        stats={[
          {
            label: "Total students",
            value: students,
            detail: `${activeStudents} active`,
          },
          { label: "Active courses", value: courses },
          { label: "Staff accounts", value: staff },
          { label: "Active / upcoming classes", value: classes },
          { label: "Income received", value: `${income.toLocaleString()} AFN` },
          {
            label: "Estimated outstanding fees",
            value: `${outstanding.toLocaleString()} AFN`,
          },
        ]}
        actions={[
          { href: "/admin/students", label: "Manage students" },
          { href: "/admin/courses", label: "Manage courses" },
          { href: "/admin/finance", label: "Finance & payments" },
          { href: "/admin/reports", label: "View reports" },
        ]}
        rows={activity.map((a) => ({
          title: a.action,
          detail: `${a.actorName} · ${a.targetType} · ${a.details || "No details"}`,
          meta: new Date(a.createdAt).toLocaleString("en-GB"),
          status: "Audit log",
        }))}
        empty="Recent audited actions will appear here as sensitive activity is recorded."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            href: "/admin/guide-performance",
            title: "Guide Performance",
            detail: "Review guide workload and student support.",
          },
          {
            href: "/admin/skill-center",
            title: "Skill Center",
            detail: "Oversee sessions, attendance, and assignments.",
          },
          {
            href: "/admin/academic-performance",
            title: "Student Performance & KPI",
            detail: "Review recorded assessments and progress.",
          },
          {
            href: "/admin/leaderboard",
            title: "Leaderboard & Talent",
            detail: "Review rankings and bookmark promising students.",
          },
          {
            href: "/admin/website",
            title: "Website & Content",
            detail: "Manage announcements and content records.",
          },
          {
            href: "/admin/audit-logs",
            title: "Audit Logs",
            detail: "Track sensitive changes and deletions.",
          },
        ].map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="rounded-xl border border-[#DCE7E2] bg-white p-5 transition hover:border-[#0B6B4F]"
          >
            <h3 className="font-semibold text-[#053B2E]">{x.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{x.detail}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-[#0B6B4F]">
              Open page →
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
