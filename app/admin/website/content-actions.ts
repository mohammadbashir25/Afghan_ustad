"use server";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import PublicStory from "@/models/PublicStory";
import AuditLog from "@/models/AuditLog";

const schema = z.object({
  type: z.enum(["SUCCESS_STORY", "TESTIMONIAL"]),
  nameEn: z.string().trim().min(2).max(120), nameFa: z.string().trim().min(2).max(120), namePs: z.string().trim().min(2).max(120),
  storyEn: z.string().trim().min(10).max(3000), storyFa: z.string().trim().min(10).max(3000), storyPs: z.string().trim().min(10).max(3000),
  outcomeEn: z.string().trim().max(1000), outcomeFa: z.string().trim().max(1000), outcomePs: z.string().trim().max(1000),
  roleEn: z.string().trim().max(120), roleFa: z.string().trim().max(120), rolePs: z.string().trim().max(120),
  categoryEn: z.string().trim().max(120), categoryFa: z.string().trim().max(120), categoryPs: z.string().trim().max(120),
  approved: z.enum(["true", "false"]), featured: z.enum(["true", "false"]), consentConfirmed: z.enum(["true", "false"]),
});
const read = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
export async function createPublicStoryAction(fd: FormData) {
  const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base = session.user.role === "MANAGER" ? "/manager/website" : "/admin/website";
  const parsed = schema.safeParse({
    type: read(fd,"type"), nameEn: read(fd,"nameEn"), nameFa: read(fd,"nameFa"), namePs: read(fd,"namePs"),
    storyEn: read(fd,"storyEn"), storyFa: read(fd,"storyFa"), storyPs: read(fd,"storyPs"),
    outcomeEn: read(fd,"outcomeEn"), outcomeFa: read(fd,"outcomeFa"), outcomePs: read(fd,"outcomePs"),
    roleEn: read(fd,"roleEn"), roleFa: read(fd,"roleFa"), rolePs: read(fd,"rolePs"),
    categoryEn: read(fd,"categoryEn"), categoryFa: read(fd,"categoryFa"), categoryPs: read(fd,"categoryPs"),
    approved: read(fd,"approved") || "false", featured: read(fd,"featured") || "false", consentConfirmed: read(fd,"consentConfirmed") || "false",
  });
  if (!parsed.success || parsed.data.consentConfirmed !== "true") redirect(`${base}?contentError=validation`);
  const raw = fd.get("photo"); const photo = raw instanceof File && raw.size > 0 ? raw : null;
  if (photo && (photo.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(photo.type))) redirect(`${base}?contentError=photo`);
  await connectDB();
  let imageUrl = "";
  if (photo) {
    try { const blob = await put(`public-stories/${Date.now()}-${photo.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-80)}`, photo, { access: "public", addRandomSuffix: true, contentType: photo.type }); imageUrl = blob.url; }
    catch (error) { console.error("Story image upload failed", error); redirect(`${base}?contentError=upload`); }
  }
  const d = parsed.data;
  await PublicStory.create({ type: d.type, studentName: d.nameEn, studentNameI18n: { en:d.nameEn, fa:d.nameFa, ps:d.namePs }, story:d.storyEn, storyI18n:{en:d.storyEn,fa:d.storyFa,ps:d.storyPs}, outcome:d.outcomeEn, outcomeI18n:{en:d.outcomeEn,fa:d.outcomeFa,ps:d.outcomePs}, role:d.roleEn, roleI18n:{en:d.roleEn,fa:d.roleFa,ps:d.rolePs}, category:d.categoryEn, categoryI18n:{en:d.categoryEn,fa:d.categoryFa,ps:d.categoryPs}, imageUrl, imageAltI18n:{en:d.nameEn,fa:d.nameFa,ps:d.namePs}, isApproved:d.approved === "true", featured:d.featured === "true", consentConfirmed:true });
  revalidatePath("/admin/website"); revalidatePath("/manager/website"); revalidatePath("/en"); revalidatePath("/fa"); revalidatePath("/ps");
  revalidatePath("/en/success-stories"); revalidatePath("/fa/success-stories"); revalidatePath("/ps/success-stories");
  redirect(`${base}?contentCreated=1`);
}

/** Update publication controls for an existing consented public story. */
export async function updatePublicStoryStatusAction(fd: FormData) {
  const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base = session.user.role === "MANAGER" ? "/manager/website" : "/admin/website";
  const id = read(fd, "storyId");
  const approved = read(fd, "approved");
  const featured = read(fd, "featured");
  if (!/^[a-f\d]{24}$/i.test(id) || !["true", "false"].includes(approved) || !["true", "false"].includes(featured)) redirect(`${base}?contentError=validation`);
  await connectDB();
  const story = await PublicStory.findById(id).select("consentConfirmed studentName type").lean();
  if (!story || (approved === "true" && !story.consentConfirmed)) redirect(`${base}?contentError=validation`);
  await PublicStory.updateOne({ _id: id }, { $set: { isApproved: approved === "true", featured: featured === "true" } });
  await AuditLog.create({ actor: session.user.id, actorName: session.user.name || session.user.email || "Staff", action: "PUBLIC_STORY_UPDATED", targetType: "PublicStory", targetId: id, details: `${story.type} for ${story.studentName}: ${approved === "true" ? "approved" : "hidden"}; ${featured === "true" ? "featured" : "not featured"}.` });
  revalidatePath("/admin/website"); revalidatePath("/manager/website");
  revalidatePath("/en"); revalidatePath("/fa"); revalidatePath("/ps");
  revalidatePath("/en/success-stories"); revalidatePath("/fa/success-stories"); revalidatePath("/ps/success-stories");
  redirect(`${base}?contentUpdated=1`);
}

/** Remove a public story or testimonial from the CMS. */
export async function deletePublicStoryAction(fd: FormData) {
  const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base = session.user.role === "MANAGER" ? "/manager/website" : "/admin/website";
  const id = read(fd, "storyId");
  if (!/^[a-f\d]{24}$/i.test(id)) redirect(`${base}?contentError=validation`);
  await connectDB();
  const story = await PublicStory.findById(id).select("studentName type").lean();
  if (!story) redirect(`${base}?contentError=validation`);
  await PublicStory.deleteOne({ _id: id });
  await AuditLog.create({ actor: session.user.id, actorName: session.user.name || session.user.email || "Staff", action: "PUBLIC_STORY_DELETED", targetType: "PublicStory", targetId: id, details: `Deleted ${story.type} for ${story.studentName}.` });
  revalidatePath("/admin/website"); revalidatePath("/manager/website");
  revalidatePath("/en"); revalidatePath("/fa"); revalidatePath("/ps");
  revalidatePath("/en/success-stories"); revalidatePath("/fa/success-stories"); revalidatePath("/ps/success-stories");
  redirect(`${base}?contentUpdated=1`);
}

/** Edit localized copy and optional photo without changing existing publication settings. */
export async function updatePublicStoryContentAction(fd: FormData) {
  const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base = session.user.role === "MANAGER" ? "/manager/website" : "/admin/website";
  const id = read(fd, "storyId");
  if (!/^[a-f\d]{24}$/i.test(id)) redirect(`${base}?contentError=validation`);
  const parsed = schema.safeParse({
    type: read(fd, "type"),
    nameEn: read(fd, "nameEn"), nameFa: read(fd, "nameFa"), namePs: read(fd, "namePs"),
    storyEn: read(fd, "storyEn"), storyFa: read(fd, "storyFa"), storyPs: read(fd, "storyPs"),
    outcomeEn: read(fd, "outcomeEn"), outcomeFa: read(fd, "outcomeFa"), outcomePs: read(fd, "outcomePs"),
    roleEn: read(fd, "roleEn"), roleFa: read(fd, "roleFa"), rolePs: read(fd, "rolePs"),
    categoryEn: read(fd, "categoryEn"), categoryFa: read(fd, "categoryFa"), categoryPs: read(fd, "categoryPs"),
    approved: "false", featured: "false", consentConfirmed: read(fd, "consentConfirmed"),
  });
  if (!parsed.success || parsed.data.consentConfirmed !== "true") redirect(`${base}?contentError=validation`);
  const raw = fd.get("photo");
  const photo = raw instanceof File && raw.size > 0 ? raw : null;
  if (photo && (photo.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(photo.type))) redirect(`${base}?contentError=photo`);
  await connectDB();
  const existing = await PublicStory.findById(id).select("imageUrl").lean();
  if (!existing) redirect(`${base}?contentError=validation`);
  let imageUrl = existing.imageUrl || "";
  if (photo) {
    try {
      const safeName = photo.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "story-photo";
      const blob = await put(`public-stories/${Date.now()}-${safeName}`, photo, { access: "public", addRandomSuffix: true, contentType: photo.type });
      imageUrl = blob.url;
    } catch (error) {
      console.error("Story image update failed", error);
      redirect(`${base}?contentError=upload`);
    }
  }
  const d = parsed.data;
  await PublicStory.updateOne({ _id: id }, { $set: {
    type: d.type,
    studentName: d.nameEn, studentNameI18n: { en: d.nameEn, fa: d.nameFa, ps: d.namePs },
    story: d.storyEn, storyI18n: { en: d.storyEn, fa: d.storyFa, ps: d.storyPs },
    outcome: d.outcomeEn, outcomeI18n: { en: d.outcomeEn, fa: d.outcomeFa, ps: d.outcomePs },
    role: d.roleEn, roleI18n: { en: d.roleEn, fa: d.roleFa, ps: d.rolePs },
    category: d.categoryEn, categoryI18n: { en: d.categoryEn, fa: d.categoryFa, ps: d.categoryPs },
    imageUrl, imageAltI18n: { en: d.nameEn, fa: d.nameFa, ps: d.namePs }, consentConfirmed: true,
  } });
  await AuditLog.create({ actor: session.user.id, actorName: session.user.name || session.user.email || "Staff", action: "PUBLIC_STORY_CONTENT_EDITED", targetType: "PublicStory", targetId: id, details: `Updated localized ${d.type.toLowerCase()} content for ${d.nameEn}.` });
  revalidatePath("/admin/website"); revalidatePath("/manager/website");
  revalidatePath("/en"); revalidatePath("/fa"); revalidatePath("/ps");
  revalidatePath("/en/success-stories"); revalidatePath("/fa/success-stories"); revalidatePath("/ps/success-stories");
  redirect(`${base}?contentUpdated=1`);
}
