import Link from "next/link";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";

export const metadata = { title: "Classes | AfghanUstad" };

export default async function ManagerClasses() {
  await requireRole(["MANAGER"]);
  await connectDB();

  const rows = await ClassRecord.find()
    .populate("course", "title")
    .populate("guide", "name")
    .populate("teacher", "name")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        eyebrow="Learning"
        title="Classes"
        description="Edit schedules, staff assignments, dates, and class status."
        actions={
          <Link
            href="/manager/classes/new"
            className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white"
          >
            Add class
          </Link>
        }
      />

      <div className="overflow-x-auto rounded-xl border border-[#DCE7E2] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Class</th>
              <th className="p-3">Course</th>
              <th className="p-3">Guide</th>
              <th className="p-3">Teacher</th>
              <th className="p-3">Schedule</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r._id)} className="border-t">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">
                  {(r.course as unknown as { title?: string } | null)?.title ??
                    "Unavailable"}
                </td>
                <td className="p-3">
                  {(r.guide as unknown as { name?: string } | null)?.name ??
                    "Not assigned"}
                </td>
                <td className="p-3">
                  {(r.teacher as unknown as { name?: string } | null)?.name ??
                    "Not assigned"}
                </td>
                <td className="p-3">{r.schedule}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  <Link
                    href={`/manager/classes/${String(r._id)}/edit`}
                    className="font-semibold text-[#0B6B4F] hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="p-6 text-slate-500">
                  No classes yet. Create a class after adding a course.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
