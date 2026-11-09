import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import OperationsTask from "@/models/OperationsTask";
import { updateOperationsTaskAction } from "./actions";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";

export const metadata = { title: "My Daily Tasks | AfghanUstad" };

export default async function OperationsTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireRole(["OPERATIONS_MANAGER"]);
  await connectDB();
  const params = await searchParams;
  const tasks = await OperationsTask.find({
    assignedRole: "OPERATIONS_MANAGER",
    $or: [{ assignedTo: null }, { assignedTo: session.user.id }],
  }).sort({ status: 1, dueDate: 1, createdAt: -1 }).lean();

  const pending = tasks.filter((task) => task.status !== "COMPLETED");
  const completed = tasks.filter((task) => task.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Daily operations" title="My Daily Tasks" description="Complete the tasks assigned by the Super Admin. Add a clear completion note before submitting each task." />
      {params.saved === "1" && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Task marked as completed.</p>}
      {params.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">This task could not be updated. It may already be completed or assigned to another person.</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Assigned tasks" value={tasks.length} />
        <Summary label="Pending tasks" value={pending.length} />
        <Summary label="Completed tasks" value={completed.length} />
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#053B2E]">Tasks to complete</h2>
        {pending.map((task) => (
          <article key={String(task._id)} className="rounded-xl border border-[#DCE7E2] bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-semibold text-[#053B2E]">{task.title}</h3>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{task.priority}</span>
            </div>
            {task.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{task.description}</p>}
            <p className="mt-2 text-xs text-slate-500">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-GB") : "No deadline"} · Status: {task.status.replace("_", " ")}</p>
            <form action={updateOperationsTaskAction} className="mt-4 space-y-3 border-t pt-4">
              <input type="hidden" name="taskId" value={String(task._id)} />
              <label className="block text-sm font-medium">Completion note
                <textarea name="completionNote" required minLength={3} maxLength={2000} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Describe what you completed, any result, and any issue that remains." />
              </label>
              <button className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">Mark completed</button>
            </form>
          </article>
        ))}
        {!pending.length && <p className="rounded-xl border border-dashed bg-white p-6 text-sm text-slate-500">You have no pending tasks.</p>}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#053B2E]">Completed tasks</h2>
        {completed.map((task) => <article key={String(task._id)} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-[#053B2E]">{task.title}</h3><span className="text-xs font-semibold text-emerald-700">Completed · {task.completedAt ? new Date(task.completedAt).toLocaleString("en-GB") : ""}</span></div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{task.completionNote}</p>
          <p className="mt-2 text-xs text-slate-500">This task is locked. Contact the Super Admin if a correction is needed.</p>
        </article>)}
        {!completed.length && <p className="rounded-xl border border-dashed bg-white p-6 text-sm text-slate-500">No tasks completed yet.</p>}
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-[#053B2E]">{value}</p></div>;
}
