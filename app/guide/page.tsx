import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import Attendance from "@/models/Attendance";
import Assignment from "@/models/Assignment";
import Performance from "@/models/Performance";
import User from "@/models/User";
import StaffAdjustment from "@/models/StaffAdjustment";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "Skill Center Guide Dashboard | AfghanUstad" };
export default async function GuideDashboard() {
  const s = await requireRole(["GUIDE"]);
  await connectDB();
  const classes = await ClassRecord.find({ guide: s.user.id })
    .populate("course", "title")
    .sort({ createdAt: -1 })
    .lean();
  const classIds = classes.map((c) => c._id);
  const [attendanceCount, taskCount, evaluations, adjustments, guideRecord] =
    await Promise.all([
      Attendance.countDocuments({ class: { $in: classIds } }),
      Assignment.countDocuments({
        class: { $in: classIds },
        status: "PUBLISHED",
      }),
      Performance.countDocuments({ class: { $in: classIds } }),
      StaffAdjustment.find({ staff: s.user.id, status: "POSTED" })
        .select("type amount")
        .lean(),
      User.findById(s.user.id).select("salaryAmount").lean(),
    ]);
  const gifts = adjustments
    .filter((a) => a.type === "GIFT")
    .reduce((n, a) => n + a.amount, 0);
  const fines = adjustments
    .filter((a) => a.type === "FINE")
    .reduce((n, a) => n + a.amount, 0);
  return (
    <div className="space-y-6">
      <ResourcePage
        eyebrow="Skill Center"
        title={`Guide Dashboard · ${s.user.name || "Guide"}`}
        description="Your core work is to perform manager-assigned tasks with students in your assigned classes, mark attendance, and record every student's score out of 100 with individual KPI feedback."
        stats={[
          { label: "Assigned classes", value: classes.length },
          { label: "Active assigned tasks", value: taskCount },
          { label: "Class attendance records", value: attendanceCount },
          { label: "Student KPI evaluations", value: evaluations },
          {
            label: "Monthly base salary",
            value: `${(guideRecord?.salaryAmount || 0).toLocaleString()} AFN`,
          },
          {
            label: "Account total after fines/gifts",
            value: `${((guideRecord?.salaryAmount || 0) + gifts - fines).toLocaleString()} AFN`,
          },
        ]}
        actions={[
          { href: "/guide/assignments", label: "Perform assigned tasks" },
          { href: "/guide/attendance", label: "Record class attendance" },
          { href: "/guide/monthly-tests", label: "Review monthly tests" },
          { href: "/guide/progress", label: "Student progress & KPI" },
        ]}
        rows={classes.map((c) => ({
          title: c.name,
          detail: `${(c.course as unknown as { title?: string } | null)?.title || "Course"} · ${c.schedule}`,
          status: c.status,
          meta: c.startDate
            ? new Date(c.startDate).toLocaleDateString("en-GB")
            : "Start date not set",
        }))}
        empty="No classes have been assigned to your account yet. Ask the manager to assign you to a class."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            href: "/guide/students",
            title: "My Students",
            detail: "Students enrolled in your assigned classes.",
          },
          {
            href: "/guide/assignments",
            title: "Manager-assigned Tasks",
            detail: "Carry out each task and record student scores out of 100.",
          },
          {
            href: "/guide/attendance",
            title: "Class Attendance",
            detail:
              "Select all present, uncheck absentees, and save once per class.",
          },
          {
            href: "/guide/kpa",
            title: "KPI Evaluations",
            detail: "Record practical feedback and student progress.",
          },
          {
            href: "/guide/monthly-tests",
            title: "Monthly Tests",
            detail:
              "Review student test submissions and record official results.",
          },
          {
            href: "/guide/notifications",
            title: "Notifications",
            detail: "See announcements sent to staff.",
          },
        ].map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="rounded-xl border border-[#DCE7E2] bg-white p-5 transition hover:border-[#0B6B4F]"
          >
            <h2 className="font-semibold text-[#053B2E]">{x.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{x.detail}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
