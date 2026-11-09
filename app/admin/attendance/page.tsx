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
        select: "name course schedule teacher status",
        populate: [
          { path: "course", select: "title" },
          { path: "teacher", select: "name" },
        ],
      })
      .sort({ class: 1, student: 1 })
      .limit(3000)
      .lean(),
    StaffAttendance.find({ date })
      .populate("staff", "name role")
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean(),
  ]);

  const students = studentRecords.filter((record) => {
    const student = record.student as unknown as {
      name?: string;
      studentId?: string;
    } | null;
    const cls = record.class as unknown as {
      name?: string;
      schedule?: string;
      course?: { title?: string } | null;
      teacher?: { name?: string } | null;
    } | null;
    return `${student?.name || ""} ${student?.studentId || ""} ${cls?.name || ""} ${cls?.schedule || ""} ${cls?.course?.title || ""} ${cls?.teacher?.name || ""}`
      .toLowerCase()
      .includes(q);
  });
  const staff = staffRecords.filter((record) => {
    const person = record.staff as unknown as {
      name?: string;
      role?: string;
    } | null;
    return `${person?.name || ""} ${person?.role || ""}`
      .toLowerCase()
      .includes(q);
  });

  const groups = new Map<string, typeof students>();
  for (const record of students) {
    const cls = record.class as unknown as { _id?: unknown } | null;
    const key = cls?._id ? String(cls._id) : "unknown";
    groups.set(key, [...(groups.get(key) || []), record]);
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Administration"
        title="Attendance Overview"
        description="Student attendance is grouped by class, teacher and scheduled time so you can quickly identify classes with absent students. Staff attendance remains separate."
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
          Search class, teacher, student or staff
          <input
            name="q"
            defaultValue={params.q || ""}
            placeholder="Class, teacher, student ID..."
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

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Student attendance by class ({students.length})
        </h2>
        {[...groups.entries()].map(([key, rows]) => {
          const cls = rows[0].class as unknown as {
            name?: string;
            schedule?: string;
            course?: { title?: string } | null;
            teacher?: { name?: string } | null;
          } | null;
          const absent = rows.filter((row) => row.status === "ABSENT").length;
          const present = rows.filter((row) => row.status === "PRESENT").length;
          return (
            <article
              key={key}
              className="overflow-hidden rounded-xl border border-[#DCE7E2] bg-white"
            >
              <header className="flex flex-wrap justify-between gap-3 border-b bg-slate-50 p-4">
                <div>
                  <h3 className="font-semibold text-[#053B2E]">
                    {cls?.name || "Class unavailable"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {cls?.course?.title || "Course"} · Teacher:{" "}
                    {cls?.teacher?.name || "Not assigned"} · Time:{" "}
                    {cls?.schedule || "Not specified"}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{rows.length} students recorded</p>
                  <p className="mt-1">
                    {present} present ·{" "}
                    <span
                      className={absent ? "font-semibold text-red-700" : ""}
                    >
                      {absent} absent
                    </span>
                  </p>
                </div>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Student ID</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((record) => {
                      const student = record.student as unknown as {
                        name?: string;
                        studentId?: string;
                      } | null;
                      return (
                        <tr key={String(record._id)} className="border-t">
                          <td className="p-3 font-medium">
                            {student?.name || "Unknown student"}
                          </td>
                          <td className="p-3">{student?.studentId || "—"}</td>
                          <td className="p-3">
                            <Status status={record.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          );
        })}
        {!students.length && (
          <p className="rounded-xl border border-dashed bg-white p-6 text-sm text-slate-500">
            No student attendance records found.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Staff attendance ({staff.length})
        </h2>
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
              {staff.map((record) => {
                const person = record.staff as unknown as {
                  name?: string;
                  role?: string;
                } | null;
                return (
                  <tr key={String(record._id)} className="border-t">
                    <td className="p-3">{person?.name || "Unknown staff"}</td>
                    <td className="p-3">{person?.role || "—"}</td>
                    <td className="p-3">{record.status}</td>
                    <td className="p-3">{record.notes || "—"}</td>
                  </tr>
                );
              })}
              {!staff.length && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    No staff attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Status({ status }: { status: string }) {
  const style =
    status === "PRESENT"
      ? "bg-emerald-50 text-emerald-800"
      : status === "ABSENT"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-800";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}
