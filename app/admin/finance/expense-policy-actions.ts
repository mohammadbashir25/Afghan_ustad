"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ExpensePolicy from "@/models/ExpensePolicy";
import AuditLog from "@/models/AuditLog";
export async function saveExpensePolicyAction(fd: FormData) {
  const s = await requireRole(["SUPER_ADMIN"]);
  const label = String(fd.get("label") || "").trim();
  const category = String(fd.get("category") || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  const dailyLimit = Number(fd.get("dailyLimit"));
  const perExpenseLimit = Number(fd.get("perExpenseLimit"));
  const requiresReceipt = fd.get("requiresReceipt") === "on";
  if (label.length < 2 || label.length > 80 || !category || category.length > 80 || !Number.isFinite(dailyLimit) || dailyLimit < 0 || !Number.isFinite(perExpenseLimit) || perExpenseLimit < 0) redirect("/admin/finance/expense-policies?error=invalid");
  await connectDB();
  const existing = await ExpensePolicy.findOne({ category }).select("_id").lean();
  const policy = await ExpensePolicy.findOneAndUpdate({ category }, { $set: { category, label, dailyLimit, perExpenseLimit, requiresReceipt, active: true, updatedBy: s.user.id } }, { upsert: true, new: true, runValidators: true });
  await AuditLog.create({ actor: s.user.id, actorName: s.user.name || s.user.email || "Super Admin", action: existing ? "EXPENSE_POLICY_UPDATED" : "EXPENSE_POLICY_CREATED", targetType: "ExpensePolicy", targetId: String(policy._id), details: `${label}: daily limit ${dailyLimit} AFN; per expense ${perExpenseLimit} AFN.` });
  revalidatePath("/admin/finance/expense-policies"); revalidatePath("/manager/expenses"); redirect("/admin/finance/expense-policies?saved=1");
}
export async function toggleExpensePolicyAction(fd: FormData) {
  const s = await requireRole(["SUPER_ADMIN"]); const id = String(fd.get("id") || "");
  if (!/^[a-f\d]{24}$/i.test(id)) redirect("/admin/finance/expense-policies?error=invalid");
  await connectDB(); const p = await ExpensePolicy.findById(id); if (!p) redirect("/admin/finance/expense-policies?error=missing");
  p.active = !p.active; p.updatedBy = s.user.id; await p.save();
  await AuditLog.create({ actor: s.user.id, actorName: s.user.name || s.user.email || "Super Admin", action: p.active ? "EXPENSE_POLICY_ENABLED" : "EXPENSE_POLICY_DISABLED", targetType: "ExpensePolicy", targetId: id, details: `${p.label} policy ${p.active ? "enabled" : "disabled"}.` });
  revalidatePath("/admin/finance/expense-policies"); revalidatePath("/manager/expenses"); redirect("/admin/finance/expense-policies?saved=1");
}
