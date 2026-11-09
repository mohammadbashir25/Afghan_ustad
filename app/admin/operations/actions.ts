"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import OperationsTask from "@/models/OperationsTask";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import Notification from "@/models/Notification";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function createOperationsTaskAction(fd: FormData) {
  const session = await requireRole(["SUPER_ADMIN"]);
  const title = text(fd, "title");
  const description = text(fd, "description");
  const assignedTo = text(fd, "assignedTo");
  const priority = text(fd, "priority") || "MEDIUM";
  const dueDateText = text(fd, "dueDate");

  if (
    title.length < 3 ||
    title.length > 160 ||
    description.length > 3000 ||
    !["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ||
    (dueDateText && !/^\d{4}-\d{2}-\d{2}$/.test(dueDateText))
  ) redirect("/admin/operations?error=invalid");

  await connectDB();

  let assignee: { _id: unknown } | null = null;
  if (assignedTo) {
    if (!/^[a-f\d]{24}$/i.test(assignedTo)) redirect("/admin/operations?error=assignee");
    assignee = await User.findOne({
      _id: assignedTo,
      role: "OPERATIONS_MANAGER",
      isActive: true,
    }).select("_id").lean();
    if (!assignee) redirect("/admin/operations?error=assignee");
  }

  const task = await OperationsTask.create({
    title,
    description,
    assignedRole: "OPERATIONS_MANAGER",
    assignedTo: assignee?._id ?? null,
    priority,
    dueDate: dueDateText ? new Date(`${dueDateText}T23:59:59.999Z`) : null,
    status: "PENDING",
    createdBy: session.user.id,
  });

  const recipients = assignee
    ? [String(assignee._id)]
    : (await User.find({ role: "OPERATIONS_MANAGER", isActive: true }).select("_id").lean()).map((person) => String(person._id));
  if (recipients.length) {
    try {
      await Notification.insertMany(recipients.map((recipient) => ({
        recipient,
        title: "New operational task assigned",
        message: `${title}${dueDateText ? ` · Due ${dueDateText}` : ""}. Open My Daily Tasks to review the instructions.`,
        kind: "SYSTEM",
        sourceId: String(task._id),
      })));
    } catch (notificationError) {
      console.error("Operations task notification delivery failed", notificationError);
    }
  }

  await AuditLog.create({
    actor: session.user.id,
    actorName: session.user.name || "Super Admin",
    action: "OPERATIONS_TASK_CREATED",
    targetType: "OperationsTask",
    targetId: String(task._id),
    details: `Created operations task: ${title}.`,
  });

  revalidatePath("/admin/operations");
  revalidatePath("/operations");
  revalidatePath("/operations/tasks");
  redirect("/admin/operations?created=1");
}
