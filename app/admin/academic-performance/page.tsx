
import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import ClassRecord from "@/models/Class";
import Performance from "@/models/Performance";

type SearchParams = Promise<{
  course?: string;
  classId?: string;
  student?: string;
}>;

type PopulatedRef = {
  _id?: unknown;
  name?: string;
  title?: string;
  role?: string;
  studentId?: string;
  username?: string;
};

type PerformanceRow = {
  _id: unknown;
  student?: PopulatedRef | null;
  course?: PopulatedRef | null;
  class?: PopulatedRef | null;
  assignment?: PopulatedRef | null;
  assessment: string;
  score: number;
  maxScore: number;
  date: Date | string;
  notes?: string;
  recordedBy?: PopulatedRef | null;
};

const isObjectId = (value: string) => /^[a-f\d]{24}$/i.test(value);

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shortId(value: unknown) {
  return String(value ?? "");
}

function formatDate(value: Date | string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default async function AcademicPerformancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["SUPER_ADMIN"]);
  await connectDB();

  const params = await searchParams;
  const selectedCourse = params.course ?? "";
  const selectedClass = params.classId ?? "";
  const studentSearch = (params.student ?? "").trim();

  const [courses, classes] = await Promise.all([
    Course.find({}).select("_id title").sort({ title: 1 }).lean(),
    ClassRecord.find({})
      .populate("course", "title")
      .select("_id name course status")
      .sort({ name: 1 })
      .lean(),
  ]);

  const filter: Record<string, unknown> = {};

  if (isObjectId(selectedCourse)) {
    filter.course = selectedCourse;
  }

  if (isObjectId(selectedClass)) {
    filter.class = selectedClass;
  }

  if (studentSearch) {
    const safeSearch = escapeRegex(studentSearch);
    const matchingStudents = await User.find({
      role: "STUDENT",
      $or: [
        { name: { $regex: safeSearch, $options: "i" } },
        { studentId: { $regex: safeSearch, $options: "i" } },
        { username: { $regex: safeSearch, $options: "i" } },
      ],
    })
      .select("_id")
      .limit(300)
      .lean();

    filter.student = {
      $in: matchingStudents.map((student) => student._id),
    };
  }

  const rawRecords = await Performance.find(filter)
    .populate("student", "name studentId username")
    .populate("course", "title")
    .populate("class", "name")
    .populate("assignment", "title")
    .populate("recordedBy", "name role")
    .sort({ date: -1, createdAt: -1 })
    .limit(500)
    .lean();

  const records = rawRecords as unknown as PerformanceRow[];

  const scoredRecords = records.filter(
    (record) =>
      Number(record.maxScore) > 0 &&
      Number.isFinite(Number(record.score)),
  );

  const averagePercentage = scoredRecords.length
    ? Math.round(
        scoredRecords.reduce(
          (total, record) =>
            total +
            (Number(record.score) / Number(record.maxScore)) * 100,
          0,
        ) / scoredRecords.length,
      )
    : 0;

  const uniqueStudents = new Set(
    scoredRecords.map((record) => shortId(record.student?._id)),
  ).size;

  const selectedCourseName =
    courses.find((course) => String(course._id) === selectedCourse)?.title ??
    "All courses";

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Academic oversight
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Students KPI &amp; Performance
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review practical assessment scores and the written feedback
            recorded by Skill Center Guides across courses and classes.
          </p>
        </div>

        <Link
          href="/admin/assignments"
          className="inline-flex w-fit items-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          View practical tasks
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Matching assessments</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {scoredRecords.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Maximum 500 latest records shown
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Students represented</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {uniqueStudents}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            In the current filtered results
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Average score</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {averagePercentage}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Each assessment normalized to a percentage
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-900">Filter performance</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search using the student’s name, student ID, or username.
          </p>
        </div>

        <form
          method="GET"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Course
            </span>
            <select
              name="course"
              defaultValue={selectedCourse}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={String(course._id)} value={String(course._id)}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Class
            </span>
            <select
              name="classId"
              defaultValue={selectedClass}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All classes</option>
              {classes.map((cls) => {
                const courseRef = cls.course as unknown as PopulatedRef | null;
                return (
                  <option key={String(cls._id)} value={String(cls._id)}>
                    {cls.name}
                    {courseRef?.title ? ` — ${courseRef.title}` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Student name / ID
            </span>
            <input
              type="search"
              name="student"
              defaultValue={studentSearch}
              placeholder="e.g. Bashir or AU-0001"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Apply filters
            </button>
            <Link
              href="/admin/academic-performance"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          Course filter: {selectedCourseName}
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Student assessments and Guide reviews
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Each row represents one recorded assessment. The review column
            displays the notes saved by the Guide.
          </p>
        </div>

        {records.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
              📋
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              No performance records found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try changing the filters. If this is a new course or class,
              its records will appear here after a Guide saves an assessment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Course / class</th>
                  <th className="px-4 py-3 font-semibold">Assessment / KPI</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Recorded by</th>
                  <th className="px-4 py-3 font-semibold">Written review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => {
                  const student = record.student;
                  const course = record.course;
                  const cls = record.class;
                  const guide = record.recordedBy;
                  const percentage =
                    Number(record.maxScore) > 0
                      ? Math.round(
                          (Number(record.score) / Number(record.maxScore)) *
                            100,
                        )
                      : 0;

                  return (
                    <tr
                      key={shortId(record._id)}
                      className="align-top hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {student?.name ?? "Unknown student"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          ID: {student?.studentId || "Not available"}
                        </p>
                        {student?.username && (
                          <p className="mt-1 text-xs text-slate-500">
                            @{student.username}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">
                          {course?.title ?? "Unknown course"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {cls?.name ?? "No class linked"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">
                          {record.assessment}
                        </p>
                        {record.assignment?.title && (
                          <p className="mt-1 text-xs text-slate-500">
                            Task: {record.assignment.title}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-900">
                          {record.score}/{record.maxScore}
                        </span>
                        <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              percentage >= 80
                                ? "bg-emerald-600"
                                : percentage >= 50
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                            }`}
                            style={{
                              width: `${Math.max(0, Math.min(100, percentage))}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {percentage}%
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDate(record.date)}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">
                          {guide?.name ?? "Unknown"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {guide?.role === "GUIDE"
                            ? "Skill Center Guide"
                            : guide?.role ?? "Staff"}
                        </p>
                      </td>

                      <td className="max-w-sm px-4 py-4">
                        {record.notes?.trim() ? (
                          <p className="whitespace-pre-wrap leading-6 text-slate-700">
                            {record.notes}
                          </p>
                        ) : (
                          <span className="text-slate-400">
                            No written review recorded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {records.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            Showing {records.length} latest records matching the selected
            filters.
          </div>
        )}
      </section>
    </main>
  );
}
