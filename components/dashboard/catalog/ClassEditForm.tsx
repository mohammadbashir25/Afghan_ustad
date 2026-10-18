
import Link from "next/link";
import { updateClassAction } from "@/app/admin/catalog-actions";

type Option = { id: string; name: string };

type ClassEditData = {
  id: string;
  name: string;
  courseId: string;
  guideId: string;
  teacherId: string;
  schedule: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
};

const field =
  "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm text-[#12372E]";

export default function ClassEditForm({
  classData,
  courses,
  guides,
  teachers,
  basePath,
}: {
  classData: ClassEditData;
  courses: Option[];
  guides: Option[];
  teachers: Option[];
  basePath: "/admin/classes" | "/manager/classes";
}) {
  return (
    <form
      action={updateClassAction}
      className="space-y-5 rounded-xl border border-[#DCE7E2] bg-white p-5"
    >
      <input type="hidden" name="classId" value={classData.id} />

      <label className="block text-sm font-medium text-[#12372E]">
        Class name
        <input
          className={field}
          name="name"
          required
          maxLength={120}
          defaultValue={classData.name}
        />
      </label>

      <label className="block text-sm font-medium text-[#12372E]">
        Course
        <select className={field} name="courseId" required defaultValue={classData.courseId}>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-[#12372E]">
          Skill Center Guide
          <select className={field} name="guideId" defaultValue={classData.guideId}>
            <option value="">Not assigned</option>
            {guides.map((guide) => (
              <option key={guide.id} value={guide.id}>{guide.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-[#12372E]">
          Assigned teacher
          <select className={field} name="teacherId" defaultValue={classData.teacherId}>
            <option value="">Not assigned</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-[#12372E]">
          Schedule
          <input
            className={field}
            name="schedule"
            required
            maxLength={160}
            defaultValue={classData.schedule}
            placeholder="Sun/Tue, 9:00–11:00"
          />
        </label>

        <label className="block text-sm font-medium text-[#12372E]">
          Status
          <select className={field} name="status" defaultValue={classData.status}>
            <option value="UPCOMING">Upcoming</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-[#12372E]">
          Start date
          <input className={field} type="date" name="startDate" defaultValue={classData.startDate} />
        </label>

        <label className="block text-sm font-medium text-[#12372E]">
          End date
          <input className={field} type="date" name="endDate" defaultValue={classData.endDate} />
        </label>
      </div>

      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        Editing class details does not recreate the class or its existing practical tasks.
      </p>

      <div className="flex flex-wrap gap-3 border-t border-[#DCE7E2] pt-4">
        <button className="rounded-lg bg-[#0B6B4F] px-5 py-2.5 text-sm font-semibold text-white">
          Save class changes
        </button>
        <Link href={basePath} className="rounded-lg border border-[#DCE7E2] px-5 py-2.5 text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}
