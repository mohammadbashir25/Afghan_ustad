import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import Assignment from "@/models/Assignment";
export const metadata = { title: "Assigned Skill Center Tasks | AfghanUstad" };
export default async function GuideAssignments() {
  const s = await requireRole(["GUIDE"]);
  await connectDB();
  const classes = await ClassRecord.find({ guide: s.user.id })
    .select("_id name")
    .lean();
  const rows = await Assignment.find({
    class: { $in: classes.map((c) => c._id) },
    status: "PUBLISHED",
  })
    .populate("course", "title")
    .populate("class", "name")
    .sort({ dueDate: 1 })
    .limit(500)
    .lean();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-[#053B2E]">
          Manager-assigned Skill Center Tasks
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          These tasks are created by the manager for your assigned classes.
          Perform them with students at the Skill Center, then score every
          student out of 100 and record individual feedback.
        </p>
      </header>
      <div className="space-y-3">
        {rows.map((task) => (
          <article
            key={String(task._id)}
            className="rounded-xl border border-[#DCE7E2] bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-[#053B2E]">{task.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {(task.class as unknown as { name?: string } | null)?.name ||
                    "Assigned class"}{" "}
                  ·{" "}
                  {(task.course as unknown as { title?: string } | null)
                    ?.title || "Course"}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Score each student /100
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
              {task.description || "No extra instructions."}
            </p>
            {task.guidesAndTips && (
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                {task.guidesAndTips}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Due {new Date(task.dueDate).toLocaleDateString("en-GB")}
              </p>
              <Link
                href={`/guide/assignments/${String(task._id)}/evaluate`}
                className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white"
              >
                Evaluate students
              </Link>
            </div>
          </article>
        ))}
        {!rows.length && (
          <p className="rounded-xl border border-dashed border-[#DCE7E2] bg-white p-6 text-sm text-slate-500">
            No published tasks are assigned to your classes yet. Ask the manager
            to create a task for one of your assigned classes.
          </p>
        )}
      </div>
    </div>
  );
}
