import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import Enrollment from "@/models/Enrollment";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
export const metadata = { title: "Class & Schedule Monitoring | AfghanUstad" };
export default async function OperationsClassesPage() {
  await requireRole(["OPERATIONS_MANAGER"]);
  await connectDB();
  const classes = await ClassRecord.find({ status: { $ne: "COMPLETED" } }).populate("course", "title").populate("teacher", "name").populate("guide", "name").sort({ status: 1, schedule: 1, name: 1 }).lean();
  const rows = await Promise.all(classes.map(async (cls) => ({ cls, students: await Enrollment.countDocuments({ class: cls._id, status: "ACTIVE" }) })));
  const active = rows.filter(({ cls }) => cls.status === "ACTIVE").length;
  const upcoming = rows.filter(({ cls }) => cls.status === "UPCOMING").length;
  return <div className="space-y-6">
    <DashboardPageHeader eyebrow="Operations" title="Class & Schedule Monitoring" description="Read-only monitoring of active and upcoming classes, teachers, guides, schedules and active enrollment counts. Schedule changes remain with the Manager or Super Admin." />
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Open classes" value={rows.length} /><Metric label="Active classes" value={active} /><Metric label="Upcoming" value={upcoming} /></div>
    <div className="overflow-x-auto rounded-xl border border-[#DCE7E2] bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Class</th><th className="p-3">Course</th><th className="p-3">Schedule</th><th className="p-3">Teacher</th><th className="p-3">Guide</th><th className="p-3">Students</th><th className="p-3">Status</th></tr></thead><tbody>
    {rows.map(({ cls, students }) => { const course = cls.course as unknown as { title?: string } | null; const teacher = cls.teacher as unknown as { name?: string } | null; const guide = cls.guide as unknown as { name?: string } | null; return <tr key={String(cls._id)} className="border-t"><td className="p-3 font-semibold">{cls.name}</td><td className="p-3">{course?.title || "—"}</td><td className="p-3">{cls.schedule || "—"}</td><td className="p-3">{teacher?.name || "Not assigned"}</td><td className="p-3">{guide?.name || "Not assigned"}</td><td className="p-3">{students}</td><td className="p-3">{cls.status}</td></tr>; })}
    {!rows.length && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No active or upcoming classes.</td></tr>}
    </tbody></table></div><p className="text-xs text-slate-500">Completed classes are intentionally excluded from this operational view.</p>
  </div>;
}
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-[#053B2E]">{value}</p></div>; }
