"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import StaffAdjustment from "@/models/StaffAdjustment";
import AuditLog from "@/models/AuditLog";
import Notification from "@/models/Notification";

export async function recordStaffAdjustmentAction(fd: FormData) {
  const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base =
    session.user.role === "SUPER_ADMIN"
      ? "/admin/staff-adjustments"
      : "/manager/staff-adjustments";
  const staffId = String(fd.get("staffId") || "");
  const type = String(fd.get("type") || "");
  const amount = Number(fd.get("amount"));
  const reason = String(fd.get("reason") || "").trim();
  const effectiveAt = String(fd.get("effectiveAt") || "");
  if (
    !/^[a-f\d]{24}$/i.test(staffId) ||
    !["FINE", "GIFT"].includes(type) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    reason.length < 3 ||
    reason.length > 1000 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(effectiveAt)
  )
    redirect(`${base}?error=invalid`);
  await connectDB();
  const staff = await User.findOne({
    _id: staffId,
    role: { $in: ["MANAGER", "GUIDE", "TEACHER", "STAFF"] },
  })
    .select("name role")
    .lean();
  if (!staff) redirect(`${base}?error=staff`);
  const record = await StaffAdjustment.create({
    staff: staffId,
    type,
    amount,
    reason,
    effectiveAt: new Date(`${effectiveAt}T00:00:00.000Z`),
    status: "POSTED",
    recordedBy: session.user.id,
    recordedByName: session.user.name || session.user.email || "Staff",
  });
  try {
    await Notification.create({
      recipient: staffId,
      title: type === "GIFT" ? "You received a gift or bonus" : "A fine was recorded",
      message: `${type === "GIFT" ? "Gift/bonus" : "Fine"}: ${amount.toLocaleString()} AFN. Reason: ${reason}`,
      kind: "FINANCE",
      sourceId: String(record._id),
    });
  } catch (notificationError) {
    console.error("Staff adjustment notification delivery failed", notificationError);
  }
  await AuditLog.create({
    actor: session.user.id,
    actorName: session.user.name || session.user.email || "Staff",
    action: type === "FINE" ? "STAFF_FINE_POSTED" : "STAFF_GIFT_POSTED",
    targetType: "StaffAdjustment",
    targetId: String(record._id),
    details: `${type} of ${amount.toLocaleString()} AFN recorded for ${staff.name} (${staff.role}). Reason: ${reason}`,
  });
  revalidatePath("/admin/staff-adjustments");
  revalidatePath("/manager/staff-adjustments");
  revalidatePath("/admin/finance");
  revalidatePath("/manager/finance");
  redirect(`${base}?saved=1`);
}
