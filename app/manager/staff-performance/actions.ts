"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import StaffPerformance from "@/models/StaffPerformance";
import Notification from "@/models/Notification";
import AuditLog from "@/models/AuditLog";
export async function recordStaffPerformanceAction(fd: FormData) {
  const s = await requireRole(["MANAGER", "SUPER_ADMIN"]);
  const base =
    s.user.role === "SUPER_ADMIN"
      ? "/admin/staff-performance"
      : "/manager/staff-performance";
  const staffId = String(fd.get("staffId") || ""),
    category = String(fd.get("category") || "").trim(),
    score = Number(fd.get("score")),
    feedback = String(fd.get("feedback") || "").trim(),
    date = String(fd.get("date") || "");
  if (
    !/^[a-f\d]{24}$/i.test(staffId) ||
    category.length < 2 ||
    category.length > 120 ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 100 ||
    feedback.length < 3 ||
    feedback.length > 2000 ||
    !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)
  )
    redirect(`${base}?error=invalid`);
  await connectDB();
  const staff = await User.findOne({
    _id: staffId,
    role: { $in: ["MANAGER", "GUIDE", "TEACHER", "STAFF"] },
    isActive: true,
  })
    .select("name role")
    .lean();
  if (!staff) redirect(`${base}?error=staff`);
  const record = await StaffPerformance.create({
    staff: staffId,
    category,
    score,
    feedback,
    date: new Date(`${date}T00:00:00.000Z`),
    recordedBy: s.user.id,
    recordedByName: s.user.name || s.user.email || "Manager",
  });
  try {
    await Notification.create({
      recipient: staffId,
      title: "New KPI evaluation",
      message: `Your KPI evaluation "${category}" was recorded with a score of ${score}/100. Feedback: ${feedback}`,
      kind: "ACADEMIC",
      sourceId: String(record._id),
    });
  } catch (notificationError) {
    console.error("Staff KPI notification delivery failed", notificationError);
  }
  await AuditLog.create({
    actor: s.user.id,
    actorName: s.user.name || s.user.email || "Manager",
    action: "STAFF_KPI_RECORDED",
    targetType: "StaffPerformance",
    targetId: String(record._id),
    details: `Recorded staff KPI ${score}/100 for ${staff.name} (${staff.role}) in ${category}.`,
  });
  revalidatePath(base);
  revalidatePath("/guide");
  revalidatePath("/teacher");
  revalidatePath("/staff");
  revalidatePath("/admin/audit-logs");
  redirect(`${base}?saved=1`);
}
