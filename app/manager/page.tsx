import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import ClassRecord from "@/models/Class";
import Attendance from "@/models/Attendance";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Payment from "@/models/Payment";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "Manager Dashboard | AfghanUstad" };
export default async function ManagerOverviewPage() {
  await requireRole(["MANAGER"]);
  await connectDB();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const [
    students,
    active,
    courses,
    classes,
    todayAttendance,
    pendingReviews,
    payments,
  ] = await Promise.all([
    User.countDocuments({ role: "STUDENT" }),
    User.countDocuments({ role: "STUDENT", isActive: true }),
    Course.countDocuments({ status: "ACTIVE" }),
    ClassRecord.countDocuments({ status: { $in: ["ACTIVE", "UPCOMING"] } }),
    Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    AssignmentSubmission.countDocuments({ status: "SUBMITTED" }),
    Payment.find().select("amountPaid").lean(),
  ]);
  const income = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  return (
    <div className="space-y-6">
      <ResourcePage
        eyebrow="Overview"
        title="Manager Dashboard"
        description="Daily academy operations: student records, classes, attendance, assignments, performance, and finance."
        stats={[
          { label: "Students", value: students, detail: `${active} active` },
          { label: "Active courses", value: courses },
          { label: "Active / upcoming classes", value: classes },
          { label: "Attendance recorded today", value: todayAttendance },
          { label: "Submissions awaiting review", value: pendingReviews },
          {
            label: "Payments recorded",
            value: `${income.toLocaleString()} AFN`,
          },
        ]}
        actions={[
          { href: "/manager/students/register", label: "Register student" },
          { href: "/manager/attendance", label: "Review attendance" },
          { href: "/manager/assignments", label: "Assignments & submissions" },
          { href: "/manager/finance", label: "Finance" },
        ]}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            href: "/manager/courses",
            title: "Courses",
            detail: "Manage course details and enrolments.",
          },
          {
            href: "/manager/classes",
            title: "Batches & Schedules",
            detail: "Organise classes and guide assignments.",
          },
          {
            href: "/manager/skill-center",
            title: "Skill Center",
            detail: "Coordinate practical sessions.",
          },
          {
            href: "/manager/performance",
            title: "Evaluations & KPI",
            detail: "Monitor assessment outcomes.",
          },
          {
            href: "/manager/guides",
            title: "Guide Management",
            detail: "Review guide assignments and workload.",
          },
          {
            href: "/manager/reports",
            title: "Reports",
            detail: "Review daily operations and progress.",
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
