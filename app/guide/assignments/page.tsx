import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import Assignment from "@/models/Assignment";

export const metadata = {
  title: "Class Assignments | AfghanUstad",
};

type PopulatedClass = {
  _id: unknown;
  name?: string;
};

type PopulatedCourse = {
  title?: string;
};

export default async function GuideAssignments() {
  const session = await requireRole(["GUIDE"]);
  await connectDB();

  const classes = await ClassRecord.find({
    guide: session.user.id,
  })
    .select("_id name")
    .sort({ name: 1 })
    .lean();

  const classIds = classes.map((item) => item._id);

  const assignments = classIds.length
    ? await Assignment.find({
        class: { $in: classIds },
        status: "PUBLISHED",
      })
        .populate("course", "title")
        .populate("class", "name")
        .sort({ dueDate: 1, title: 1 })
        .limit(500)
        .lean()
    : [];

  const assignmentsByClass = new Map<string, typeof assignments>();

  for (const cls of classes) {
    assignmentsByClass.set(String(cls._id), []);
  }

  for (const assignment of assignments) {
    const cls = assignment.class as unknown as PopulatedClass | null;

    if (!cls?._id) continue;

    const classId = String(cls._id);
    const classAssignments = assignmentsByClass.get(classId);

    if (classAssignments) {
      classAssignments.push(assignment);
    }
  }

  const totalAssignments = assignments.length;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-[#0B6B4F]">GUIDE DASHBOARD</p>

        <h1 className="mt-1 text-2xl font-bold text-[#053B2E]">
          Class Assignments
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Assignments are organized by class. Open the relevant class to
          evaluate its students and record individual scores and feedback.
        </p>

        <div className="mt-4 inline-flex rounded-lg border border-[#DCE7E2] bg-white px-4 py-3">
          <div>
            <p className="text-xs text-slate-500">Published assignments</p>
            <p className="text-xl font-bold text-[#053B2E]">
              {totalAssignments}
            </p>
          </div>
        </div>
      </header>

      {!classes.length && (
        <div className="rounded-xl border border-dashed border-[#DCE7E2] bg-white p-6">
          <h2 className="font-semibold text-[#053B2E]">No classes assigned</h2>
          <p className="mt-2 text-sm text-slate-500">
            Ask the manager to assign you to a Skill Center class.
          </p>
        </div>
      )}

      {classes.map((cls) => {
        const classAssignments = assignmentsByClass.get(String(cls._id)) ?? [];

        return (
          <section
            key={String(cls._id)}
            className="overflow-hidden rounded-2xl border border-[#DCE7E2] bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE7E2] bg-[#F4F9F6] p-5">
              <div>
                <h2 className="text-lg font-bold text-[#053B2E]">{cls.name}</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Assignments and evaluations for this class
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#0B6B4F]">
                {classAssignments.length}{" "}
                {classAssignments.length === 1 ? "assignment" : "assignments"}
              </span>
            </div>

            {classAssignments.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">
                No published assignments for this class yet.
              </p>
            ) : (
              <div className="divide-y divide-[#DCE7E2]">
                {classAssignments.map((task) => {
                  const course =
                    task.course as unknown as PopulatedCourse | null;

                  const dueDate = new Date(task.dueDate);

                  return (
                    <article key={String(task._id)} className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-[#053B2E]">
                            {task.title}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {course?.title || "Course"}
                          </p>
                        </div>

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                          Score / 100
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                        {task.description || "No additional instructions."}
                      </p>

                      {task.guidesAndTips && (
                        <div className="mt-3 rounded-lg bg-slate-50 p-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Resources and instructions
                          </p>

                          <p className="whitespace-pre-wrap text-sm text-slate-600">
                            {task.guidesAndTips}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">
                          Due{" "}
                          {Number.isNaN(dueDate.getTime())
                            ? "Not specified"
                            : dueDate.toLocaleDateString("en-GB")}
                        </p>

                        <Link
                          href={`/guide/assignments/${String(
                            task._id,
                          )}/evaluate`}
                          className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#08563F]"
                        >
                          Evaluate students
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
