import type {
  CourseCategory,
  CourseLevel,
  Locale,
  LocalizedText,
} from "./types";

/** Shared client-safe course catalogue constants and localization helpers. */
export const COURSES_NAMESPACE = "coursesPage" as const;
export const CATEGORY_ORDER: readonly CourseCategory[] = [
  "computerBasics",
  "productivity",
  "graphicDesign",
  "videoEditing",
  "internet",
  "digitalMarketing",
  "web",
  "database",
  "programming",
];
export const LEVEL_ORDER: readonly CourseLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
];
export const GUIDANCE_STEP_IDS = ["choose", "review", "enroll"] as const;
export const CTA_LINKS = { enroll: "/enroll", contact: "/contact" } as const;
export const LOCALES: readonly Locale[] = ["en", "fa", "ps"];

export function localize(text: LocalizedText, locale: string): string {
  return (LOCALES as readonly string[]).includes(locale)
    ? text[locale as Locale]
    : text.en;
}
