import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";

export const metadata = { title: "Attendance Monitoring | AfghanUstad" };

type SearchParams = { date?: string; q?: string };

export default async function ManagerAttendancePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole(["OPERATIONS_MANAGER"]);
  await connectDB();
  const params = await searchParams;
  const dateText = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
    ? params.date
    : new Date().toISOString().slice(0, 10);
  const date = new Date(`${dateText}T00:00:00.000Z`);
  const q = (params.q || "").trim().toLowerCase();

  const records = await Attendance.find({ date })
    .populate("student", "name studentId")
    .populate({
      path: "class",
      select: "name course schedule teacher status",
      populate: [
        { path: "course", select: "title" },
        { path: "teacher", select: "name" },
      ],
    })
    .sort({ class: 1, student: 1 })
    .limit(3000)
    .lean();

  const filtered = records.filter((record) => {
    const student = record.student as unknown as { name?: string; studentId?: string } | null;
    const cls = record.class as unknown as { name?: string; schedule?: string; course?: { title?: string } | null; teacher?: { name?: string } | null } | null;
    return `${student?.name || ""} ${student?.studentId || ""} ${cls?.name || ""} ${cls?.course?.title || ""} ${cls?.teacher?.name || ""} ${cls?.schedule || ""}`.toLowerCase().includes(q);
  });

  const groups = new Map<string, typeof filtered>();
  for (const record of filtered) {
    const cls = record.class as unknown as { _id?: unknown } | null;
    const key = cls?._id ? String(cls._id) : "unknown";
    groups.set(key, [...(groups.get(key) || []), record]);
  }

  const present = filtered.filter((record) => record.status === "PRESENT").length;
  const absent = filtered.filter((record) => record.status === "ABSENT").length;
  const late = filtered.filter((record) => record.status === "LATE").length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Learning" title="Attendance Monitoring" description="Attendance is grouped by class. Review each class's teacher, scheduled time, and the students who are present, absent, or late." />
      <div className="grid gap-3 sm:grid-cols-3"><Summary label="Present" value={present} /><Summary label="Absent" value={absent} /><Summary label="Late" value={late} /></div>
      <form className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
        <label className="text-sm">Attendance date<input type="date" name="date" defaultValue={dateText} className="mt-1 block rounded-lg border px-3 py-2" /></label>
        <label className="text-sm">Search class, teacher or student<input name="q" defaultValue={q} placeholder="Class, teacher, student ID..." className="mt-1 block rounded-lg border px-3 py-2" /></label>
        <button className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">Apply</button>
        <Link href="/manager/attendance" className="rounded-lg px-3 py-2 text-sm text-slate-600">Clear</Link>
      </form>

      {[...groups.entries()].map(([key, rows]) => {
        const cls = rows[0].class as unknown as { name?: string; schedule?: string; course?: { title?: string } | null; teacher?: { name?: string } | null } | null;
        const classPresent = rows.filter((row) => row.status === "PRESENT").length;
        const classAbsent = rows.filter((row) => row.status === "ABSENT").length;
        return <section key={key} className="overflow-hidden rounded-xl border border-[#DCE7E2] bg-white">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b bg-slate-50 p-4">
            <div><h2 className="font-semibold text-[#053B2E]">{cls?.name || "Class unavailable"}</h2><p className="mt-1 text-sm text-slate-600">{cls?.course?.title || "Course"} · Teacher: {cls?.teacher?.name || "Not assigned"} · Time: {cls?.schedule || "Not specified"}</p></div>
            <div className="text-right text-xs text-slate-500"><p>{rows.length} attendance records</p><p className="mt-1">{classPresent} present · {classAbsent} absent</p></div>
          </header>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-500"><tr><th className="p-3">Student</th><th className="p-3">Student ID</th><th className="p-3">Date</th><th className="p-3">Status</th></tr></thead><tbody>
            {rows.map((record) => { const student = record.student as unknown as { name?: string; studentId?: string } | null; return <tr key={String(record._id)} className="border-t"><td className="p-3 font-medium">{student?.name || "Unknown student"}</td><td className="p-3">{student?.studentId || "—"}</td><td className="p-3">{dateText}</td><td className="p-3"><Status status={record.status} /></td></tr>; })}
          </tbody></table></div>
        </section>;
      })}
      {!filtered.length && <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">No attendance records were found for this date and search.</p>}
      <p className="text-xs text-slate-500">Only saved records are displayed. Students without a saved record are not automatically classified as absent.</p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>; }
function Status({ status }: { status: string }) { const style = status === "PRESENT" ? "bg-emerald-50 text-emerald-800" : status === "ABSENT" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{status}</span>; }
