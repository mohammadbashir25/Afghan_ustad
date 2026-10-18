/**
 * data.ts
 * ---------------------------------------------------------------------------
 * Course configuration for the landing-page Courses section.
 *
 * Content notes
 * - Course listings are loaded from the real course catalogue in MongoDB.
 *   No course titles, durations, lesson counts or outcomes are fabricated.
 * - `coverImage` still uses the `CLIENT_INPUT_REQUIRED` marker (never shown as
 *   text); an abstract on-brand cover is drawn until a real image is set.
 * - Course/category TEXT is stored per locale (`LocalizedText`), exactly the
 *   shape a CMS returns. UI chrome (headings, buttons, filter label, empty
 *   state, level names) lives in next-intl messages (`landing.courses`).
 * - The UI hides any meta value that is still the placeholder marker, so you
 *   can leave a field unset and it simply won't render.
 *
 * Active course records are passed from the server page into the presentation components.
 */
import type { IconType } from "react-icons";
import { LuGlobe, LuMonitor, LuTerminal } from "react-icons/lu";

/* ------------------------------ Placeholders ----------------------------- */

/** Marker for facts the client must supply and verify. */
export const CLIENT_INPUT_REQUIRED = "[CLIENT INPUT REQUIRED]" as const;
export type Pending = typeof CLIENT_INPUT_REQUIRED;

/** Type guard: true when a value is still the placeholder marker. */
export const isPending = (value: unknown): value is Pending =>
  value === CLIENT_INPUT_REQUIRED;

/* -------------------------------- Locales -------------------------------- */

export type CourseLocale = "en" | "fa" | "ps";

/** Per-locale text, the shape a headless CMS returns. */
export type LocalizedText = Readonly<Record<CourseLocale, string>>;

const isCourseLocale = (value: string): value is CourseLocale =>
  value === "en" || value === "fa" || value === "ps";

/** Resolve localized text for the active locale, falling back to English. */
export const localize = (text: LocalizedText, locale: string): string =>
  text[isCourseLocale(locale) ? locale : "en"];

/** True when the localized value is real content (not the placeholder). */
export const hasText = (text: LocalizedText, locale: string): boolean => {
  const value = localize(text, locale);
  return !isPending(value) && value.trim().length > 0;
};

/* -------------------------------- Taxonomy -------------------------------- */

/** Reserved id of the "show everything" filter. */
export const ALL_CATEGORY_ID = "all" as const;

export interface CourseCategory {
  /** Stable id used by filters and by `Course.categoryId`. */
  readonly id: string;
  readonly label: LocalizedText;
  /** Structural icon only; carries no claim about the topic. */
  readonly icon: IconType;
}

/** Course categories shown as filter chips (empty ones are hidden). */
export const COURSE_CATEGORIES: readonly CourseCategory[] = [
  {
    id: "fundamentals",
    label: { en: "Computer Fundamentals", fa: "مبانی کمپیوتر", ps: "د کمپیوټر بنسټونه" },
    icon: LuMonitor,
  },
  {
    id: "programming",
    label: { en: "Programming", fa: "برنامه‌نویسی", ps: "پروګرامینګ" },
    icon: LuTerminal,
  },
  {
    id: "web",
    label: { en: "Web Development", fa: "توسعهٔ وب", ps: "د ویب پراختیا" },
    icon: LuGlobe,
  },
] as const;

/* --------------------------------- Courses -------------------------------- */

export type CourseLevel = "beginner" | "intermediate" | "advanced";

/** Abstract cover motifs used until the client supplies real artwork. */
export type CoverVariant = "lattice" | "grid" | "rings" | "path";

export interface Course {
  readonly id: string;
  /** URL slug; falls back to the catalog page if left as the placeholder. */
  readonly slug: string;
  readonly categoryId: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly level: CourseLevel | Pending;
  readonly duration: LocalizedText;
  readonly lessonCount: number | Pending;
  /** Real cover image URL, or the placeholder (an abstract cover is drawn). */
  readonly coverImage: string;
  readonly coverVariant: CoverVariant;
  /** Featured courses sort first and take the large "lead" slot. */
  readonly isFeatured: boolean;
}

/** Featured first in display order; the rest keep this editorial order. */
/** No invented course listings. The homepage receives active courses from MongoDB. */
export const COURSES: readonly Course[] = [];

/* ---------------------------------- Config -------------------------------- */

/** The home page is curated: never show more than this many courses. */
export const HOME_COURSE_LIMIT = 6 as const;

/** Full catalog route (rendered through next-intl's localized Link). */
export const COURSES_ALL_HREF = "/courses" as const;

/** Detail-page href; falls back to the catalog while the slug is pending. */
export const getCourseHref = (course: Course): string =>
  isPending(course.slug) || course.slug.trim().length === 0
    ? COURSES_ALL_HREF
    : `${COURSES_ALL_HREF}/${course.slug}`;

/**
 * Featured courses first, otherwise the original (editorial) order.
 * Array.prototype.sort is stable, so ties keep their CMS order.
 */
export const sortForDisplay = (courses: readonly Course[]): Course[] =>
  [...courses].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));