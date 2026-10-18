"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Expense from "@/models/Expense";
import ExpensePolicy from "@/models/ExpensePolicy";
import AuditLog from "@/models/AuditLog";
export async function recordManagerExpenseAction(fd: FormData) {
  const s = await requireRole(["MANAGER"]);
  const title = String(fd.get("title") || "").trim(); const category = String(fd.get("category") || "").trim().toLowerCase();
  const amount = Number(fd.get("amount")); const dateText = String(fd.get("date") || ""); const note = String(fd.get("note") || "").trim(); const receiptUrl = String(fd.get("receiptUrl") || "").trim();
  if (title.length < 2 || title.length > 160 || !category || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(dateText) || note.length > 1000 || receiptUrl.length > 1000) redirect("/manager/expenses?error=invalid");
  await connectDB();
  const policy = await ExpensePolicy.findOne({ category, active: true }).lean();
  if (!policy) redirect("/manager/expenses?error=policy");
  const date = new Date(`${dateText}T00:00:00.000Z`);
  if (policy.requiresReceipt && !receiptUrl) redirect("/manager/expenses?error=receipt");
  if (policy.perExpenseLimit > 0 && amount > policy.perExpenseLimit) redirect("/manager/expenses?error=per-limit");
  const dayStart = new Date(`${dateText}T00:00:00.000Z`); const dayEnd = new Date(dayStart.getTime() + 86400000);
  const used = await Expense.aggregate([{ $match: { category, date: { $gte: dayStart, $lt: dayEnd }, status: { $ne: "REJECTED" } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
  const totalToday = Number(used[0]?.total || 0);
  if (policy.dailyLimit > 0 && totalToday + amount > policy.dailyLimit) redirect("/manager/expenses?error=daily-limit");
  const expense = await Expense.create({ title, category, amount, date, note, receiptUrl, policy: policy._id, status: "RECORDED", recordedBy: s.user.id });
  await AuditLog.create({ actor: s.user.id, actorName: s.user.name || s.user.email || "Manager", action: "MANAGER_EXPENSE_RECORDED", targetType: "Expense", targetId: String(expense._id), details: `${title}: ${amount.toLocaleString()} AFN (${policy.label}).` });
  revalidatePath("/manager/expenses"); revalidatePath("/admin/finance/expenses"); revalidatePath("/admin/finance"); redirect("/manager/expenses?created=1");
}
