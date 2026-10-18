import Link from "next/link";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";

export const metadata = { title: "Courses | AfghanUstad" };

export default async function ManagerCourses() {
  await requireRole(["MANAGER"]);
  await connectDB();

  const rows = await Course.find().sort({ createdAt: -1 }).limit(500).lean();

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        eyebrow="Learning"
        title="Courses"
        description="Create, edit, publish, draft, and archive courses."
        actions={
          <Link
            href="/manager/courses/new"
            className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white"
          >
            Add course
          </Link>
        }
      />

      <div className="overflow-x-auto rounded-xl border border-[#DCE7E2] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Course</th>
              <th className="p-3">Category</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Fee (AFN)</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r._id)} className="border-t">
                <td className="p-3 font-medium">{r.title}</td>
                <td className="p-3">{r.category}</td>
                <td className="p-3">{r.duration}</td>
                <td className="p-3">{r.fee.toLocaleString()}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  <Link
                    href={`/manager/courses/${String(r._id)}/edit`}
                    className="font-semibold text-[#0B6B4F] hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="p-6 text-slate-500">
                  No courses yet. Add the first course to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
