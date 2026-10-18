/**
 * Courses page — domain types
 * ---------------------------------------------------------------------------
 * `Course` mirrors what a CMS / database row would return, so swapping the
 * placeholder data for a real source later never touches the UI.
 * Optional fields (`durationWeeks`, `image`, `featured`) are only rendered
 * when they exist.
 */

export type Locale = "en" | "fa" | "ps";

/** A CMS-style localized string. */
export type LocalizedText = Record<Locale, string>;

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseCategory = "computerBasics" | "programming" | "web" | "productivity";
export type CourseStatus = "open" | "comingSoon";

/** Filter value: a concrete option, or "all" for no filtering. */
export type Filter<T extends string> = T | "all";

export interface Course {
  readonly id: string;
  /** URL segment: /[locale]/courses/[slug] */
  readonly slug: string;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  readonly category: CourseCategory;
  readonly level: CourseLevel;
  readonly status: CourseStatus;
  /** Length in weeks. Omit when unknown. */
  readonly durationWeeks?: number;
  /** Public image path. When absent a neutral pattern is drawn instead. */
  readonly image?: string;
  /** At most one course should be featured. */
  readonly featured?: boolean;
}
