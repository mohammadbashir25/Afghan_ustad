import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import Attendance from "@/models/Attendance";
import Payment from "@/models/Payment";
import Performance from "@/models/Performance";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "Reports | AfghanUstad" };
export default async function Page() {
  await requireRole(["SUPER_ADMIN"]);
  await connectDB();
  const [students, courses, attendance, payments, assessments, active] =
    await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      Course.countDocuments(),
      Attendance.countDocuments(),
      Payment.find().select("amountPaid").lean(),
      Performance.countDocuments(),
      User.countDocuments({ role: "STUDENT", isActive: true }),
    ]);
  const income = payments.reduce((s, p) => s + p.amountPaid, 0);
  return (
    <ResourcePage
      eyebrow="System"
      title="Reports"
      description="System-wide reporting snapshot. Use the linked operational pages to inspect underlying records."
      stats={[
        { label: "Students", value: students, detail: `${active} active` },
        { label: "Courses", value: courses },
        { label: "Attendance records", value: attendance },
        { label: "Assessments", value: assessments },
        { label: "Recorded income", value: `${income.toLocaleString()} AFN` },
      ]}
      actions={[
        { href: "/admin/students", label: "Student report" },
        { href: "/admin/attendance", label: "Attendance report" },
        { href: "/admin/academic-performance", label: "Performance report" },
        { href: "/admin/finance", label: "Financial report" },
      ]}
      rows={[
        {
          title: "Student enrolment",
          detail: "Student totals and active status",
          meta: `${active} active / ${students} total`,
        },
        {
          title: "Attendance",
          detail: "Recorded attendance across sessions",
          meta: `${attendance} records`,
        },
        {
          title: "Performance",
          detail: "Recorded assessments and KPI data",
          meta: `${assessments} assessments`,
        },
        {
          title: "Finance",
          detail: "Payments recorded in the system",
          meta: `${income.toLocaleString()} AFN received`,
        },
      ]}
    />
  );
}
