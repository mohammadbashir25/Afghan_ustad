import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import Assignment from "@/models/Assignment";
import Enrollment from "@/models/Enrollment";
import Performance from "@/models/Performance";
import User from "@/models/User";

export const metadata = { title: "Class Assignments | AfghanUstad" };

export default async function GuideAssignments({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const session = await requireRole(["GUIDE"]);
  await connectDB();
  const params = await searchParams;

  const classes = await ClassRecord.find({
    guide: session.user.id,
    status: { $ne: "COMPLETED" },
  })
    .select("_id name schedule teacher course")
    .populate("teacher", "name")
    .populate("course", "title")
    .sort({ name: 1 })
    .lean();

  const selectedClass = classes.find(
    (item) => String(item._id) === params.classId,
  );
  const assignments = selectedClass
    ? await Assignment.find({
        class: selectedClass._id,
        status: { $in: ["PUBLISHED", "CLOSED"] },
      })
        .populate("course", "title")
        .sort({ dueDate: 1, title: 1 })
        .limit(300)
        .lean()
    : [];

  const rosterEnrollments = selectedClass
    ? await Enrollment.find({ class: selectedClass._id, status: "ACTIVE" })
        .select("student")
        .lean()
    : [];
  const enrolledIds = rosterEnrollments.map((row) => String(row.student));
  const legacyStudents = selectedClass
    ? await User.find({
        role: "STUDENT",
        isActive: true,
        $or: [
          { class: selectedClass._id },
          { class: null, course: selectedClass.course },
        ],
      })
        .select("_id")
        .lean()
    : [];
  const legacyIds = legacyStudents.map((student) => String(student._id));
  const legacyEnrollmentRows = legacyIds.length
    ? await Enrollment.find({ student: { $in: legacyIds } })
        .select("student")
        .lean()
    : [];
  const anyEnrollmentIds = new Set(
    legacyEnrollmentRows.map((row) => String(row.student)),
  );
  const legacyOnlyIds = legacyIds.filter((id) => !anyEnrollmentIds.has(id));
  const rosterIds = [...new Set([...enrolledIds, ...legacyOnlyIds])];
  const rosterSize = rosterIds.length;

  const taskStates = await Promise.all(
    assignments.map(async (task) => {
      const evaluatedIds = await Performance.distinct("student", {
        assignment: task._id,
        class: selectedClass?._id,
        student: { $in: rosterIds },
      });
      const completed =
        task.status === "CLOSED" ||
        (rosterSize > 0 && evaluatedIds.length >= rosterSize);
      return { task, completed, evaluated: evaluatedIds.length };
    }),
  );

  const teacher = selectedClass?.teacher as unknown as { name?: string } | null;
  const course = selectedClass?.course as unknown as { title?: string } | null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#0B6B4F]">GUIDE DASHBOARD</p>
        <h1 className="mt-1 text-2xl font-bold text-[#053B2E]">
          Class Assignments
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Select one of your active classes to review its assignments and
          evaluate student work. Completed classes and completed tasks are
          locked.
        </p>
      </header>

      <form
        method="get"
        action="/guide/assignments"
        className="grid gap-3 rounded-xl border border-[#DCE7E2] bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <label className="text-sm font-medium">
          Select class
          <select
            name="classId"
            required
            defaultValue={selectedClass ? String(selectedClass._id) : ""}
            className="mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2"
          >
            <option value="" disabled>
              Choose an active class
            </option>
            {classes.map((item) => {
              const itemTeacher = item.teacher as unknown as {
                name?: string;
              } | null;
              return (
                <option key={String(item._id)} value={String(item._id)}>
                  {item.name} · {item.schedule || "Time not set"} ·{" "}
                  {itemTeacher?.name || "No teacher"}
                </option>
              );
            })}
          </select>
        </label>
        <button className="rounded-lg bg-[#0B6B4F] px-5 py-2.5 text-sm font-semibold text-white">
          View assignments
        </button>
      </form>

      {!classes.length && (
        <p className="rounded-xl border border-dashed bg-white p-6 text-sm text-slate-500">
          No active classes are assigned to you.
        </p>
      )}

      {selectedClass && (
        <section className="rounded-xl border border-[#DCE7E2] bg-white p-5">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#053B2E]">
                {selectedClass.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {course?.title || "Course"} · Teacher:{" "}
                {teacher?.name || "Not assigned"} · Time:{" "}
                {selectedClass.schedule || "Not specified"}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              {taskStates.length} assignments
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#DCE7E2]">
            {taskStates.map(({ task, completed, evaluated }) => (
              <article key={String(task._id)} className="py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#053B2E]">
                      {task.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {(task.course as unknown as { title?: string } | null)
                        ?.title || "Course"}{" "}
                      · Due {new Date(task.dueDate).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${completed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}
                  >
                    {completed ? "Completed · Locked" : "In progress"}
                  </span>
                </div>
                {task.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                    {task.description}
                  </p>
                )}
                {task.guidesAndTips && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Resources and instructions
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                      {task.guidesAndTips}
                    </p>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Evaluations recorded: {evaluated}
                    {rosterSize ? ` / ${rosterSize} students` : ""}
                  </p>
                  {completed ? (
                    <span className="text-sm font-semibold text-emerald-700">
                      Evaluation is locked
                    </span>
                  ) : (
                    <Link
                      href={`/guide/assignments/${String(task._id)}/evaluate`}
                      className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Evaluate students
                    </Link>
                  )}
                </div>
              </article>
            ))}
            {!taskStates.length && (
              <p className="py-6 text-sm text-slate-500">
                No assignments have been published for this class.
              </p>
            )}
          </div>
        </section>
      )}

      {!selectedClass && classes.length > 0 && (
        <div className="rounded-xl border border-dashed border-[#DCE7E2] bg-white p-6 text-sm text-slate-500">
          Choose a class above to display only its assignments.
        </div>
      )}
    </div>
  );
}
