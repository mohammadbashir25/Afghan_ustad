import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import OperationsTask from "@/models/OperationsTask";
import ClassRecord from "@/models/Class";
import Attendance from "@/models/Attendance";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";

export const metadata = { title: "Operations Manager Dashboard | AfghanUstad" };

export default async function OperationsOverviewPage() {
  const session = await requireRole(["OPERATIONS_MANAGER"]);
  await connectDB();
  const [tasks, activeClasses, attendanceToday] = await Promise.all([
    OperationsTask.find({ assignedRole: "OPERATIONS_MANAGER", $or: [{ assignedTo: null }, { assignedTo: session.user.id }] }).select("status").lean(),
    ClassRecord.countDocuments({ status: { $in: ["ACTIVE", "UPCOMING"] } }),
    Attendance.countDocuments({ date: { $gte: new Date(new Date().setUTCHours(0,0,0,0)), $lt: new Date(new Date(new Date().setUTCHours(0,0,0,0)).getTime() + 86400000) } }),
  ]);
  const pending = tasks.filter((t) => t.status !== "COMPLETED").length;
  const completed = tasks.length - pending;

  return <div className="space-y-6">
    <DashboardPageHeader eyebrow="Daily execution" title="Operations Manager Dashboard" description="Monitor daily academy operations, complete Admin-assigned tasks, and report issues that need management attention." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Assigned tasks" value={tasks.length} />
      <Metric label="Pending tasks" value={pending} />
      <Metric label="Completed tasks" value={completed} />
      <Metric label="Active / upcoming classes" value={activeClasses} />
    </div>
    <section className="grid gap-4 md:grid-cols-2">
      <Link href="/operations/tasks" className="rounded-xl border border-[#DCE7E2] bg-white p-5 hover:border-[#0B6B4F]">
        <h2 className="font-semibold text-[#053B2E]">My Daily Tasks</h2>
        <p className="mt-2 text-sm text-slate-500">Review Admin assignments, submit completion notes and keep the task history accurate.</p>
        <p className="mt-4 text-sm font-semibold text-[#0B6B4F]">Open tasks →</p>
      </Link>
      <div className="rounded-xl border border-[#DCE7E2] bg-white p-5">
        <h2 className="font-semibold text-[#053B2E]">Attendance recorded today</h2>
        <p className="mt-2 text-3xl font-bold text-[#053B2E]">{attendanceToday}</p>
        <p className="mt-1 text-sm text-slate-500">Saved student attendance entries across the academy.</p>
      </div>
    </section>
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-[#053B2E]">{value}</p></div>;
}
