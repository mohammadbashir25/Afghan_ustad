/**
 * Success Stories — domain types
 * ---------------------------------------------------------------------------
 * A story is built ONLY from real, approved material. Almost every field is
 * optional, and the UI renders exactly the fields that exist. Text fields are
 * LocalizedText so a CMS can supply en / fa / ps versions of a real story.
 */

export type Locale = "en" | "fa" | "ps";
export type LocalizedText = Record<Locale, string>;

/** Topic used for filtering. Filters appear only if ≥ 2 distinct ones exist. */
export interface StoryCategory {
  readonly id: string;
  readonly label: LocalizedText;
}

export interface StoryImage {
  /** Public path or allowed remote URL. */
  readonly src: string;
  /** Describe the photo; falls back to the student's name when missing. */
  readonly alt?: LocalizedText;
}

export interface SuccessStory {
  readonly id: string;
  readonly slug: string;
  /**
   * TRUST GATE: a story is displayed only when the learner (or guardian) has
   * approved it. Anything else is ignored by the page.
   */
  readonly approved: boolean;
  /** At most one story should be featured. */
  readonly featured?: boolean;

  readonly studentName?: LocalizedText;
  /** The story text, in the learner's own words (or an approved summary). */
  readonly story?: LocalizedText;
  readonly image?: StoryImage;
  /** Linked course (slug enables a link to /courses/[slug]). */
  readonly course?: { readonly slug?: string; readonly title: LocalizedText };
  readonly category?: StoryCategory;
  /** A verified outcome, stated by the learner. Never auto-generated. */
  readonly result?: LocalizedText;
  /** ISO date, e.g. "2026-03-14". Only the year is displayed. */
  readonly date?: string;
  /** Ordered steps of the learner's path (e.g. courses taken). */
  readonly learningPath?: readonly LocalizedText[];
}
