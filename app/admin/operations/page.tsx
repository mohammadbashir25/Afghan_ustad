import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import OperationsTask from "@/models/OperationsTask";
import { createOperationsTaskAction } from "./actions";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";

export const metadata = { title: "Operations Task Control | AfghanUstad" };

export default async function AdminOperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  await requireRole(["SUPER_ADMIN"]);
  await connectDB();
  const params = await searchParams;
  const [operationsManagers, tasks] = await Promise.all([
    User.find({ role: "OPERATIONS_MANAGER", isActive: true }).select("_id name email").sort({ name: 1 }).lean(),
    OperationsTask.find().populate("assignedTo", "name").populate("completedBy", "name").sort({ createdAt: -1 }).limit(300).lean(),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Administration"
        title="Operations Task Control"
        description="Create and assign daily operational responsibilities. The Operations Manager can update progress and submit a completion note; Admin retains task ownership."
      />
      {params.created === "1" && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Task created successfully.</p>}
      {params.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Please check the task details and selected Operations Manager.</p>}

      <form action={createOperationsTaskAction} className="grid gap-4 rounded-2xl border border-[#DCE7E2] bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold text-[#053B2E]">Create a task</h2>
          <p className="mt-1 text-sm text-slate-500">Tasks are assigned to the Operations Manager by default.</p>
        </div>
        <label className="text-sm font-medium">Task title
          <input name="title" required minLength={3} maxLength={160} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="e.g. Verify today's class attendance" />
        </label>
        <label className="text-sm font-medium">Priority
          <select name="priority" defaultValue="MEDIUM" className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
          </select>
        </label>
        <label className="text-sm font-medium">Assign to
          <select name="assignedTo" defaultValue="" className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="">All Operations Managers</option>
            {operationsManagers.map((person) => <option key={String(person._id)} value={String(person._id)}>{person.name} ({person.email})</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Due date
          <input type="date" name="dueDate" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="text-sm font-medium md:col-span-2">Instructions / details
          <textarea name="description" rows={3} maxLength={3000} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Explain what needs to be done and what counts as completion." />
        </label>
        <div className="md:col-span-2"><button className="rounded-lg bg-[#0B6B4F] px-5 py-2.5 text-sm font-semibold text-white">Create and assign task</button></div>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#053B2E]">Task history</h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50"><tr><th className="p-3">Task</th><th className="p-3">Assigned to</th><th className="p-3">Priority</th><th className="p-3">Due</th><th className="p-3">Status</th><th className="p-3">Completion note</th></tr></thead>
            <tbody>
              {tasks.map((task) => {
                const assigned = task.assignedTo as unknown as { name?: string } | null;
                return <tr key={String(task._id)} className="border-t align-top">
                  <td className="p-3"><p className="font-semibold">{task.title}</p><p className="mt-1 max-w-sm text-xs text-slate-500">{task.description}</p></td>
                  <td className="p-3">{assigned?.name || "All Operations Managers"}</td>
                  <td className="p-3">{task.priority}</td>
                  <td className="p-3">{task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-GB") : "—"}</td>
                  <td className="p-3">{task.status}</td>
                  <td className="p-3 max-w-xs whitespace-pre-wrap">{task.completionNote || "—"}</td>
                </tr>;
              })}
              {!tasks.length && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No operations tasks created yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
