"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import OperationsTask from "@/models/OperationsTask";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function updateOperationsTaskAction(fd: FormData) {
  const session = await requireRole(["OPERATIONS_MANAGER"]);
  const taskId = String(fd.get("taskId") || "").trim();
  const note = String(fd.get("completionNote") || "").trim();

  if (!/^[a-f\d]{24}$/i.test(taskId) || note.length < 3 || note.length > 2000) {
    redirect("/operations/tasks?error=invalid");
  }

  await connectDB();
  const task = await OperationsTask.findOne({
    _id: taskId,
    assignedRole: "OPERATIONS_MANAGER",
    status: { $ne: "COMPLETED" },
    $or: [{ assignedTo: null }, { assignedTo: session.user.id }],
  });

  if (!task) redirect("/operations/tasks?error=unavailable");

  task.status = "COMPLETED";
  task.completionNote = note;
  task.completedBy = session.user.id;
  task.completedAt = new Date();
  await task.save();

  const administrators = await User.find({ role: "SUPER_ADMIN", isActive: true }).select("_id").lean();
  if (administrators.length) {
    try {
      await Notification.insertMany(administrators.map((admin) => ({
        recipient: admin._id,
        title: "Operations task completed",
        message: `${session.user.name || "Operations Manager"} completed "${task.title}". Note: ${note}`,
        kind: "SYSTEM",
        sourceId: String(task._id),
      })));
    } catch (notificationError) {
      console.error("Task completion notification delivery failed", notificationError);
    }
  }

  await AuditLog.create({
    actor: session.user.id,
    actorName: session.user.name || "Operations Manager",
    action: "OPERATIONS_TASK_COMPLETED",
    targetType: "OperationsTask",
    targetId: String(task._id),
    details: `Completed task "${task.title}". Note: ${note}`,
  });

  revalidatePath("/operations");
  revalidatePath("/operations/tasks");
  revalidatePath("/admin/operations");
  revalidatePath("/admin/audit-logs");
  redirect("/operations/tasks?saved=1");
}
