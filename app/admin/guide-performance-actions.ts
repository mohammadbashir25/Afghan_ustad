"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import GuideReview from "@/models/GuideReview";
import AuditLog from "@/models/AuditLog";
import Notification from "@/models/Notification";
export async function recordGuideReviewAction(fd: FormData) {
  const s = await requireRole(["SUPER_ADMIN"]);
  const guideId = String(fd.get("guideId") || "");
  const qualityScore = Number(fd.get("qualityScore"));
  const category = String(fd.get("category") || "OVERALL");
  const notes = String(fd.get("notes") || "").trim();
  const improvementPlan = String(fd.get("improvementPlan") || "").trim();
  if (
    !/^[a-f\d]{24}$/i.test(guideId) ||
    !Number.isFinite(qualityScore) ||
    qualityScore < 0 ||
    qualityScore > 100 ||
    notes.length < 3 ||
    notes.length > 2000 ||
    improvementPlan.length > 2000 ||
    ![
      "TEACHING_QUALITY",
      "STUDENT_PROGRESS",
      "RELIABILITY",
      "PROFESSIONALISM",
      "OVERALL",
    ].includes(category)
  )
    redirect("/admin/guide-performance?error=invalid");
  await connectDB();
  const guide = await User.findOne({ _id: guideId, role: "GUIDE" })
    .select("name")
    .lean();
  if (!guide) redirect("/admin/guide-performance?error=guide");
  const review = await GuideReview.create({
    guide: guideId,
    qualityScore,
    category,
    notes,
    improvementPlan,
    reviewedBy: s.user.id,
    reviewDate: new Date(),
  });

  await Notification.create({
    recipient: guideId,
    title: "New performance review",
    message: `A ${category.replace(/_/g, " ").toLowerCase()} review was recorded with a score of ${qualityScore}/100. Feedback: ${notes}${improvementPlan ? ` Improvement plan: ${improvementPlan}` : ""}`,
    kind: "ACADEMIC",
    sourceId: String(review._id),
  });
  await AuditLog.create({
    actor: s.user.id,
    actorName: s.user.name || s.user.email || "Super Admin",
    action: "GUIDE_PERFORMANCE_REVIEWED",
    targetType: "Guide",
    targetId: guideId,
    details: `${guide.name}: quality score ${qualityScore}/100. ${notes}`,
  });
  revalidatePath("/admin/guide-performance");
  revalidatePath("/guide/performance");
  redirect("/admin/guide-performance?reviewed=1");
}
export async function deactivateLowPerformingGuideAction(fd: FormData) {
  const s = await requireRole(["SUPER_ADMIN"]);
  const guideId = String(fd.get("guideId") || "");
  const reason = String(fd.get("reason") || "").trim();
  if (
    !/^[a-f\d]{24}$/i.test(guideId) ||
    reason.length < 10 ||
    reason.length > 1000
  )
    redirect("/admin/guide-performance?error=reason");
  await connectDB();
  const reviews = await GuideReview.find({ guide: guideId })
    .sort({ reviewDate: -1 })
    .limit(2)
    .lean();
  if (reviews.length < 2 || reviews.some((r) => r.qualityScore >= 60))
    redirect("/admin/guide-performance?error=threshold");
  const guide = await User.findOneAndUpdate(
    { _id: guideId, role: "GUIDE", isActive: true },
    { $set: { isActive: false } },
    { new: true },
  )
    .select("name email")
    .lean();
  if (!guide) redirect("/admin/guide-performance?error=guide");
  await AuditLog.create({
    actor: s.user.id,
    actorName: s.user.name || s.user.email || "Super Admin",
    action: "GUIDE_DEACTIVATED_LOW_PERFORMANCE",
    targetType: "Guide",
    targetId: guideId,
    details: `Deactivated ${guide.name}. Reason: ${reason}. Last two quality reviews were below 60/100.`,
  });
  revalidatePath("/admin/guide-performance");
  revalidatePath("/admin/users");
  redirect("/admin/guide-performance?deactivated=1");
}
