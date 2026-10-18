import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import User from "@/models/User";
import Performance from "@/models/Performance";
import StaffAdjustment from "@/models/StaffAdjustment";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "Teacher Dashboard | AfghanUstad" };
export default async function TeacherDashboard() {
  const s = await requireRole(["TEACHER"]);
  await connectDB();
  const classes = await ClassRecord.find({ teacher: s.user.id })
    .populate("course", "title")
    .sort({ name: 1 })
    .lean();
  const classIds = classes.map((c) => c._id);
  const students = await User.find({
    role: "STUDENT",
    isActive: true,
    $or: [
      { class: { $in: classIds } },
      { course: { $in: classes.map((c) => c.course) } },
    ],
  })
    .select("_id")
    .lean();
  const [evaluations, adjustments, teacherRecord] = await Promise.all([
    Performance.find({ class: { $in: classIds } })
      .select("student score maxScore")
      .lean(),
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
    <div className="space-y-5">
      <ResourcePage
        eyebrow="Teacher workspace"
        title={`Welcome, ${s.user.name || "Teacher"}`}
        description="See your assigned classes, enrolled students, recorded attendance, student KPI/progress, leaderboard, and your staff account adjustments."
        stats={[
          { label: "Assigned classes", value: classes.length },
          {
            label: "Students in assigned classes",
            value: new Set(students.map((x) => String(x._id))).size,
          },
          { label: "Recorded student evaluations", value: evaluations.length },
          {
            label: "Monthly base salary",
            value: `${(teacherRecord?.salaryAmount || 0).toLocaleString()} AFN`,
          },
          {
            label: "Adjusted account total",
            value: `${((teacherRecord?.salaryAmount || 0) + gifts - fines).toLocaleString()} AFN`,
          },
        ]}
        actions={[
          { href: "/teacher/classes", label: "My classes and students" },
          { href: "/teacher/progress", label: "Student progress & KPI" },
          { href: "/teacher/leaderboard", label: "Student leaderboard" },
          { href: "/teacher/attendance", label: "My attendance" },
        ]}
        rows={classes.map((c) => ({
          title: c.name,
          detail: `${(c.course as unknown as { title?: string } | null)?.title || "Course"} · ${c.schedule}`,
          status: c.status,
          meta: `${c.startDate ? new Date(c.startDate).toLocaleDateString("en-GB") : "Start date not set"}`,
        }))}
        empty="No classes have been assigned to your teacher account yet."
      />
      <section className="grid gap-3 sm:grid-cols-2">
        {[
          {
            href: "/teacher/classes",
            title: "My Classes & Students",
            detail: "Class roster and assigned course details.",
          },
          {
            href: "/teacher/progress",
            title: "Student Progress & KPI",
            detail:
              "Review guide-recorded practical results and student feedback.",
          },
          {
            href: "/teacher/leaderboard",
            title: "Leaderboard",
            detail: "Review students' monthly results across the academy.",
          },
          {
            href: "/teacher/attendance",
            title: "My Staff Attendance",
            detail: "View attendance records for your staff account.",
          },
        ].map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="rounded-xl border border-[#DCE7E2] bg-white p-4"
          >
            <h2 className="font-semibold text-[#053B2E]">{x.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{x.detail}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
