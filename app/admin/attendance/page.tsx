
import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import StaffAttendance from "@/models/StaffAttendance";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";

export const metadata = { title: "Attendance | AfghanUstad" };

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; q?: string }>;
}) {
  await requireRole(["SUPER_ADMIN"]);
  await connectDB();

  const params = await searchParams;
  const dateText =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : new Date().toISOString().slice(0, 10);
  const date = new Date(`${dateText}T00:00:00.000Z`);
  const q = (params.q || "").trim().toLowerCase();

  const [studentRecords, staffRecords] = await Promise.all([
    Attendance.find({ date })
      .populate("student", "name studentId")
      .populate({
        path: "class",
        select: "name course",
        populate: { path: "course", select: "title" },
      })
      .sort({ createdAt: -1 })
      .limit(3000)
      .lean(),
    StaffAttendance.find({ date })
      .populate("staff", "name role")
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean(),
  ]);

  const students = studentRecords.filter((r) => {
    const student = r.student as unknown as {
      name?: string;
      studentId?: string;
    } | null;
    const cls = r.class as unknown as {
      name?: string;
      course?: { title?: string } | null;
    } | null;

    return `${student?.name || ""} ${student?.studentId || ""} ${
      cls?.name || ""
    } ${cls?.course?.title || ""}`
      .toLowerCase()
      .includes(q);
  });

  const staff = staffRecords.filter((r) => {
    const person = r.staff as unknown as {
      name?: string;
      role?: string;
    } | null;
    return `${person?.name || ""} ${person?.role || ""}`
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Administration"
        title="Attendance Overview"
        description="View saved student and staff attendance. Only assigned Skill Center Guides can edit student attendance; Managers record staff attendance."
      />

      <form className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
        <label className="text-sm">
          Date
          <input
            type="date"
            name="date"
            defaultValue={dateText}
            className="mt-1 block rounded-lg border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Search
          <input
            name="q"
            defaultValue={params.q || ""}
            placeholder="Student, staff, ID, class..."
            className="mt-1 block rounded-lg border px-3 py-2"
          />
        </label>
        <button className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">
          Apply
        </button>
        <Link href="/admin/attendance" className="px-3 py-2 text-sm">
          Clear
        </Link>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Student attendance ({students.length})</h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">ID</th>
                <th className="p-3">Course</th>
                <th className="p-3">Class</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((r) => {
                const student = r.student as unknown as {
                  name?: string;
                  studentId?: string;
                } | null;
                const cls = r.class as unknown as {
                  name?: string;
                  course?: { title?: string } | null;
                } | null;
                return (
                  <tr key={String(r._id)} className="border-t">
                    <td className="p-3">{student?.name || "Unknown student"}</td>
                    <td className="p-3">{student?.studentId || "—"}</td>
                    <td className="p-3">{cls?.course?.title || "—"}</td>
                    <td className="p-3">{cls?.name || "—"}</td>
                    <td className="p-3">{r.status}</td>
                  </tr>
                );
              })}
              {!students.length && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">No student attendance records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Staff attendance ({staff.length})</h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Staff member</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((r) => {
                const person = r.staff as unknown as {
                  name?: string;
                  role?: string;
                } | null;
                return (
                  <tr key={String(r._id)} className="border-t">
                    <td className="p-3">{person?.name || "Unknown staff"}</td>
                    <td className="p-3">{person?.role || "—"}</td>
                    <td className="p-3">{r.status}</td>
                    <td className="p-3">{r.notes || "—"}</td>
                  </tr>
                );
              })}
              {!staff.length && (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500">No staff attendance records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
