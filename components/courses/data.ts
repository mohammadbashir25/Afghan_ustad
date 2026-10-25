import "server-only";
/**
 * Courses page â€” data layer
 * ---------------------------------------------------------------------------
 * PLACEHOLDER catalog (edit freely). `getCourses()` is the single seam to
 * replace with a CMS / database call; everything else consumes `Course[]`.
 * UI labels (categories, levels, guidance) are next-intl keys, never copy.
 */
import { connectDB } from "@/lib/mongodb";
import CourseModel from "@/models/Course";
import type {
  Course,
  CourseCategory,
  CourseLevel,
  CourseStatus,
  LocalizedText,
} from "./types";

export {
  COURSES_NAMESPACE,
  CATEGORY_ORDER,
  LEVEL_ORDER,
  GUIDANCE_STEP_IDS,
  CTA_LINKS,
  LOCALES,
  localize,
} from "./catalog";

export async function getCourses(): Promise<readonly Course[]> {
  try {
    await connectDB();
    const docs = await CourseModel.find({ status: "ACTIVE" })
      .sort({ featured: -1, createdAt: -1 })
      .limit(100)
      .lean();
    const localizeRow = (value: unknown, fallback = ""): LocalizedText => {
      if (value && typeof value === "object") {
        const row = value as Partial<LocalizedText>;
        return {
          en: row.en || fallback,
          fa: row.fa || row.en || fallback,
          ps: row.ps || row.en || fallback,
        };
      }
      return { en: fallback, fa: fallback, ps: fallback };
    };
    return docs.map((doc) => {
      const row = doc as unknown as {
        _id: unknown;
        slug: string;
        categoryI18n?: { en?: string };
        category?: string;
        titleI18n?: unknown;
        title: string;
        descriptionI18n?: unknown;
        description?: string;
        level?: string;
        durationI18n?: { en?: string };
        duration?: string;
        thumbnailUrl?: string;
        featured?: boolean;
      };
      const categoryText = String(row.categoryI18n?.en || row.category || "")
        .normalize("NFKD")
        .toLowerCase()
        .trim()
        .replace(/[_-]+/g, " ");
      const category: CourseCategory = /database|sql|دیتابیس|ډیټابیس/.test(
        categoryText,
      )
        ? "database"
        : /digital\s*market|marketing|مارکیټنګ|بازاریابی/.test(categoryText)
          ? "digitalMarketing"
          : /graphic\s*design|design|ګرافیک|گرافیک/.test(categoryText)
            ? "graphicDesign"
            : /video\s*edit|premiere|پریمیر|ویدیو|ویډیو/.test(categoryText)
              ? "videoEditing"
              : /web\s*development|web|html|css|javascript|ویب/.test(
                    categoryText,
                  )
                ? "web"
                : /internet|online|انټرنېټ|اینترنت/.test(categoryText)
                  ? "internet"
                  : /program|coding|code|برنامه.?نویسی|پروګرام/.test(
                        categoryText,
                      )
                    ? "programming"
                    : /office|product|productivity|کمپیوټر|کمپیوتر|fundamental|basic/.test(
                          categoryText,
                        )
                      ? "productivity"
                      : "computerBasics";
      const weeks = Number(
        String(row.durationI18n?.en || row.duration || "").match(/\d+/)?.[0],
      );
      return {
        id: String(row._id),
        slug: row.slug,
        title: localizeRow(row.titleI18n, row.title),
        description: localizeRow(row.descriptionI18n, row.description || ""),
        category,
        level: (typeof row.level === "string" &&
        ["beginner", "intermediate", "advanced"].includes(row.level)
          ? row.level
          : "beginner") as CourseLevel,
        status: "open" as CourseStatus,
        durationWeeks: Number.isFinite(weeks) && weeks > 0 ? weeks : undefined,
        image: row.thumbnailUrl || undefined,
        featured: Boolean(row.featured),
      };
    });
  } catch (error) {
    console.error("Course catalogue read failed", error);
    return [];
  }
}
