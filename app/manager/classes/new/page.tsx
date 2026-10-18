
import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import User from "@/models/User";
import { createClassAction } from "@/app/admin/catalog-actions";
import PracticalTaskFields from "@/components/dashboard/classes/PracticalTaskFields";

export const metadata = { title: "Add Class | AfghanUstad" };

const f =
  "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm";

export default async function NewManagerClass() {
  await requireRole(["MANAGER"]);
  await connectDB();

  const [courses, guides, teachers] = await Promise.all([
    Course.find({ status: "ACTIVE" })
      .select("title _id")
      .sort({ title: 1 })
      .lean(),
    User.find({ role: "GUIDE", isActive: true })
      .select("name _id")
      .sort({ name: 1 })
      .lean(),
    User.find({ role: "TEACHER", isActive: true })
      .select("name _id")
      .sort({ name: 1 })
      .lean(),
  ]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-[#053B2E]">Add class</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create the class, assign its Guide and teacher, and prepare its
          Skill Center tasks.
        </p>
      </header>

      {!courses.length ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          Create an active course first.{" "}
          <Link className="underline" href="/manager/courses/new">
            Add course
          </Link>
        </p>
      ) : (
        <form
          action={createClassAction}
          className="grid max-w-4xl gap-4 rounded-xl border border-[#DCE7E2] bg-white p-5 sm:grid-cols-2"
        >
          <label className="text-sm font-medium">
            Class name
            <input name="name" required minLength={2} className={f} />
          </label>

          <label className="text-sm font-medium">
            Course
            <select name="courseId" required className={f}>
              {courses.map((course) => (
                <option key={String(course._id)} value={String(course._id)}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Guide
            <select name="guideId" defaultValue="" className={f}>
              <option value="">Not assigned</option>
              {guides.map((guide) => (
                <option key={String(guide._id)} value={String(guide._id)}>
                  {guide.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Assigned teacher
            <select name="teacherId" defaultValue="" className={f}>
              <option value="">Not assigned</option>
              {teachers.map((teacher) => (
                <option
                  key={String(teacher._id)}
                  value={String(teacher._id)}
                >
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Schedule
            <input
              name="schedule"
              required
              placeholder="Sun/Tue, 9:00–11:00"
              className={f}
            />
          </label>

          <label className="text-sm font-medium">
            Start date
            <input name="startDate" type="date" className={f} />
          </label>

          <label className="text-sm font-medium">
            End date
            <input name="endDate" type="date" className={f} />
          </label>

          <label className="text-sm font-medium">
            Status
            <select name="status" className={f}>
              <option value="UPCOMING">Upcoming</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </label>

          <div className="sm:col-span-2">
            <div className="mb-4 border-t border-[#DCE7E2]" />
            <PracticalTaskFields />
          </div>

          <div className="flex items-end gap-3 sm:col-span-2">
            <button className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">
              Save class and tasks
            </button>
            <Link href="/manager/classes" className="px-3 py-2 text-sm">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
