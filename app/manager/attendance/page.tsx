
import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";

export const metadata = { title: "Student Attendance | AfghanUstad" };

type SearchParams = {
  date?: string;
  q?: string;
};

export default async function ManagerAttendancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole(["MANAGER"]);
  await connectDB();

  const params = await searchParams;
  const dateText =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : new Date().toISOString().slice(0, 10);

  const date = new Date(`${dateText}T00:00:00.000Z`);
  const q = (params.q || "").trim();

  const records = await Attendance.find({
    date,
  })
    .populate("student", "name studentId")
    .populate({
      path: "class",
      select: "name course",
      populate: { path: "course", select: "title" },
    })
    .sort({ class: 1, student: 1 })
    .limit(3000)
    .lean();

  const filtered = records.filter((record) => {
    const student = record.student as unknown as {
      name?: string;
      studentId?: string;
    } | null;
    const cls = record.class as unknown as {
      name?: string;
      course?: { title?: string } | null;
    } | null;

    const search = `${student?.name || ""} ${student?.studentId || ""} ${
      cls?.name || ""
    } ${cls?.course?.title || ""}`.toLowerCase();

    return !q || search.includes(q.toLowerCase());
  });

  const present = filtered.filter((r) => r.status === "PRESENT").length;
  const absent = filtered.filter((r) => r.status === "ABSENT").length;
  const late = filtered.filter((r) => r.status === "LATE").length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Learning"
        title="Student Attendance"
        description="Read-only attendance records across classes. Student attendance is recorded by assigned Skill Center Guides."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Present" value={present} />
        <Summary label="Absent" value={absent} />
        <Summary label="Late" value={late} />
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
        <label className="text-sm">
          Attendance date
          <input
            type="date"
            name="date"
            defaultValue={dateText}
            className="mt-1 block rounded-lg border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Search student or class
          <input
            name="q"
            defaultValue={q}
            placeholder="Name, student ID, class..."
            className="mt-1 block rounded-lg border px-3 py-2"
          />
        </label>
        <button className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">
          Apply
        </button>
        <Link
          href="/manager/attendance"
          className="rounded-lg px-3 py-2 text-sm text-slate-600"
        >
          Clear
        </Link>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Student ID</th>
              <th className="p-3">Course</th>
              <th className="p-3">Class</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => {
              const student = record.student as unknown as {
                _id: unknown;
                name?: string;
                studentId?: string;
              } | null;
              const cls = record.class as unknown as {
                name?: string;
                course?: { title?: string } | null;
              } | null;

              return (
                <tr
                  key={String(record._id)}
                  className="border-t border-slate-100"
                >
                  <td className="p-3">{student?.name || "Unknown student"}</td>
                  <td className="p-3">{student?.studentId || "—"}</td>
                  <td className="p-3">{cls?.course?.title || "—"}</td>
                  <td className="p-3">{cls?.name || "—"}</td>
                  <td className="p-3">{dateText}</td>
                  <td className="p-3 font-medium">{record.status}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No attendance records were found for this date and search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        This view shows saved records only. Students with no saved record for
        the selected date are not listed as absent automatically.
      </p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
