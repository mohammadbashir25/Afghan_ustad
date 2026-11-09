import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Assignment from "@/models/Assignment";
import ClassRecord from "@/models/Class";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import Performance from "@/models/Performance";
import { saveTaskEvaluationAction } from "./actions";

export const metadata = { title: "Evaluate Skill Center Task | AfghanUstad" };
const field =
  "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm";

export default async function EvaluateTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireRole(["GUIDE"]);
  const { id } = await params;
  const query = await searchParams;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  await connectDB();

  const task = await Assignment.findOne({ _id: id, status: "PUBLISHED" })
    .populate("course", "title")
    .lean();
  if (!task || !task.class) notFound();

  const cls = await ClassRecord.findOne({
    _id: task.class,
    guide: session.user.id,
  })
    .select("name course status")
    .lean();
  if (!cls || cls.status === "COMPLETED") notFound();

  const [enrollments, legacy, prior] = await Promise.all([
    Enrollment.find({ class: cls._id, status: "ACTIVE" })
      .select("student")
      .lean(),
    User.find({
      role: "STUDENT",
      isActive: true,
      $or: [{ class: cls._id }, { class: null, course: cls.course }],
    })
      .select("_id name studentId")
      .sort({ name: 1 })
      .lean(),
    Performance.find({ assignment: id, class: cls._id })
      .select("student score notes")
      .lean(),
  ]);

  const legacyIds = legacy.map((student) => String(student._id));
  const legacyEnrollments = legacyIds.length
    ? await Enrollment.find({ student: { $in: legacyIds } })
        .select("student")
        .lean()
    : [];
  const alreadyEnrolled = new Set(
    legacyEnrollments.map((row) => String(row.student)),
  );
  const rosterIds = new Set([
    ...enrollments.map((row) => String(row.student)),
    ...legacy
      .filter((student) => !alreadyEnrolled.has(String(student._id)))
      .map((student) => String(student._id)),
  ]);

  const students = rosterIds.size
    ? await User.find({
        _id: { $in: [...rosterIds] },
        role: "STUDENT",
        isActive: true,
      })
        .select("name studentId")
        .sort({ name: 1 })
        .lean()
    : [];

  const previous = new Map<string, { score: number; notes?: string }>(
    prior.map((row) => [
      String(row.student),
      { score: row.score, notes: row.notes },
    ]),
  );
  const evaluated = new Set(prior.map((row) => String(row.student)));
  const locked =
    students.length > 0 &&
    students.every((student) => evaluated.has(String(student._id)));
  const errors: Record<string, string> = {
    score: "Enter a score from 0 to 100 for every student.",
    roster: "No active students are enrolled in this class.",
    permission:
      "This task is not assigned to your class or the class is completed.",
    locked:
      "This assignment is completed and locked. Scores can no longer be changed.",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href="/guide/assignments"
        className="text-sm font-semibold text-[#0B6B4F]"
      >
        ← Assigned tasks
      </Link>
      <header>
        <h1 className="text-2xl font-bold text-[#053B2E]">
          Evaluate: {task.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {cls.name} ·{" "}
          {(task.course as unknown as { title?: string } | null)?.title ||
            "Course"}{" "}
          · each student is graded out of 100
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
          {task.description || "No task instructions provided."}
        </p>
      </header>
      {query.saved && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Scores and individual feedback saved.
        </p>
      )}
      {query.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {errors[query.error] || "Could not save evaluations."}
        </p>
      )}
      {locked ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="font-semibold text-emerald-900">
            Assignment completed and locked
          </h2>
          <p className="mt-1 text-sm text-emerald-800">
            All {students.length} active students have evaluation records. This
            task is read-only and scores cannot be changed.
          </p>
        </div>
      ) : !students.length ? (
        <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">
          No active students found in this class.
        </p>
      ) : (
        <form action={saveTaskEvaluationAction} className="space-y-4">
          <input type="hidden" name="assignmentId" value={id} />
          {students.map((student) => {
            const old = previous.get(String(student._id));
            return (
              <section
                key={String(student._id)}
                className="grid gap-3 rounded-xl border border-[#DCE7E2] bg-white p-4 sm:grid-cols-[1fr_160px]"
              >
                <div>
                  <h2 className="font-semibold text-[#053B2E]">
                    {student.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {student.studentId || "Student ID pending"}
                  </p>
                  <label className="mt-3 block text-sm font-medium">
                    Individual feedback
                    <textarea
                      name={`feedback_${String(student._id)}`}
                      defaultValue={old?.notes || ""}
                      rows={3}
                      maxLength={1000}
                      className={field}
                      placeholder="What did the student do well? What should they improve?"
                    />
                  </label>
                </div>
                <label className="text-sm font-medium">
                  Score / 100
                  <input
                    name={`score_${String(student._id)}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    defaultValue={old?.score ?? ""}
                    className={field}
                  />
                </label>
              </section>
            );
          })}
          <p className="text-xs text-slate-500">
            Once all active students have been evaluated, the assignment is
            automatically marked completed and locked.
          </p>
          <button className="rounded-lg bg-[#0B6B4F] px-4 py-2.5 text-sm font-semibold text-white">
            Save all student evaluations
          </button>
        </form>
      )}
    </div>
  );
}
