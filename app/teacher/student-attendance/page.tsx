
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import Attendance from "@/models/Attendance";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";

export const metadata = {
  title: "Student Attendance History | AfghanUstad",
};

export default async function TeacherStudentAttendancePage() {
  const session = await requireRole(["TEACHER"]);
  await connectDB();

  const classes = await ClassRecord.find({
    teacher: session.user.id,
  })
    .select("_id name")
    .lean();

  const classIds = classes.map((cls) => cls._id);

  const records = classIds.length
    ? await Attendance.find({ class: { $in: classIds } })
        .populate("student", "name studentId")
        .populate("class", "name")
        .sort({ date: -1 })
        .limit(2000)
        .lean()
    : [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Teaching"
        title="Student Attendance History"
        description="Read-only attendance history for students in your assigned classes."
      />

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Student</th>
              <th className="p-3">Student ID</th>
              <th className="p-3">Class</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const student = record.student as unknown as {
                name?: string;
                studentId?: string;
              } | null;
              const cls = record.class as unknown as {
                name?: string;
              } | null;

              return (
                <tr key={String(record._id)} className="border-t">
                  <td className="p-3">
                    {new Date(record.date).toISOString().slice(0, 10)}
                  </td>
                  <td className="p-3">{student?.name || "Unknown student"}</td>
                  <td className="p-3">{student?.studentId || "—"}</td>
                  <td className="p-3">{cls?.name || "—"}</td>
                  <td className="p-3">{record.status}</td>
                </tr>
              );
            })}
            {!records.length && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  No attendance records found for your assigned classes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
