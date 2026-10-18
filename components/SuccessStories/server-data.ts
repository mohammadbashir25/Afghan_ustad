/** Public success stories and testimonials are loaded from MongoDB and only
 * shown when publication consent is confirmed and an administrator approves them. */
import "server-only";
import { connectDB } from "@/lib/mongodb";
import PublicStory from "@/models/PublicStory";
import type { LocalizedText, SuccessStory } from "./types";

/** Public success-story and testimonial content comes from MongoDB. */
export async function getStories(): Promise<readonly SuccessStory[]> {
  try {
    await connectDB();
    const docs = await PublicStory.find({ isApproved: true, consentConfirmed: true }).sort({ featured: -1, createdAt: -1 }).limit(100).lean();
    const localized = (value: unknown, fallback = ""): LocalizedText => {
      if (value && typeof value === "object") {
        const row = value as Partial<LocalizedText>;
        return { en: row.en || fallback, fa: row.fa || row.en || fallback, ps: row.ps || row.en || fallback };
      }
      return { en: fallback, fa: fallback, ps: fallback };
    };
    return docs.map((doc) => {
      const row = doc as unknown as { _id: unknown; isApproved?: boolean; featured?: boolean; studentNameI18n?: unknown; studentName?: string; storyI18n?: unknown; story?: string; outcomeI18n?: unknown; outcome?: string; categoryI18n?: unknown; category?: string; imageUrl?: string; imageAltI18n?: unknown; createdAt?: Date };
      const categoryLabel = localized(row.categoryI18n, row.category || "");
      return {
        id: String(row._id), slug: String(row._id), approved: Boolean(row.isApproved), featured: Boolean(row.featured),
        studentName: localized(row.studentNameI18n, row.studentName || ""),
        story: localized(row.storyI18n, row.story || ""),
        result: localized(row.outcomeI18n, row.outcome || ""),
        category: row.category ? { id: String(row.category).toLowerCase().replace(/[^a-z0-9]+/g, "-"), label: categoryLabel } : undefined,
        image: row.imageUrl ? { src: row.imageUrl, alt: localized(row.imageAltI18n, row.studentName || "Student") } : undefined,
        date: row.createdAt ? new Date(row.createdAt).toISOString().slice(0,10) : undefined,
      } as SuccessStory;
    });
  } catch (error) {
    console.error("Public stories read failed", error);
    return [];
  }
}

