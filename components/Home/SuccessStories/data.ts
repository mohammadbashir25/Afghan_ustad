/**
 * data.ts
 * ---------------------------------------------------------------------------
 * Story data, contracts and carousel configuration for the Success Stories
 * section.
 *
 * TRUST RULES (enforced in code, not just by convention)
 * - No stories are fabricated. Only approved, consented records loaded from
 *   the public CMS are eligible to appear. With no approved records, the UI
 *   shows its designed empty state.
 * - No salaries, percentages, employers or before/after numbers are used.
 * - A story only reaches the public page when it is explicitly approved AND
 *   has a real name and story (`getPublishableStories`).
 *
 * Story records use the same localized shape as the public CMS.
 */

/* ------------------------------ Placeholders ----------------------------- */

/** Marker for facts the client must supply and verify. */
export const CLIENT_INPUT_REQUIRED = "[CLIENT INPUT REQUIRED]" as const;
export type Pending = typeof CLIENT_INPUT_REQUIRED;

/** Type guard: true while a value is still the placeholder marker. */
export const isPending = (value: unknown): value is Pending =>
  value === CLIENT_INPUT_REQUIRED;

/* -------------------------------- Locales -------------------------------- */

export type StoryLocale = "en" | "fa" | "ps";

/** Per-locale text, the shape a headless CMS returns. */
export type LocalizedText = Readonly<Record<StoryLocale, string>>;

const isStoryLocale = (value: string): value is StoryLocale =>
  value === "en" || value === "fa" || value === "ps";

/** Locales that read right-to-left (drives slide direction and keys). */
export const isRtlLocale = (locale: string): boolean =>
  locale === "fa" || locale === "ps";

/** Text resolved for the active locale, falling back to English. */
export interface ResolvedText {
  readonly value: string;
  /** True while the value is still the placeholder marker. */
  readonly isPending: boolean;
}

/**
 * Resolve optional localized text. Returns null when the field is absent or
 * empty, so presentation can simply skip it.
 */
export const resolveText = (
  text: LocalizedText | undefined,
  locale: string,
): ResolvedText | null => {
  if (!text) return null;
  const value = text[isStoryLocale(locale) ? locale : "en"];
  if (value.trim().length === 0) return null;
  return { value, isPending: isPending(value) };
};

/** True only for real (non-placeholder, non-empty) text in this locale. */
const hasRealText = (text: LocalizedText, locale: StoryLocale): boolean => {
  const value = text[locale];
  return !isPending(value) && value.trim().length > 0;
};

/* --------------------------------- Stories -------------------------------- */

export interface StoryImage {
  /** Real photo URL, or the placeholder marker (a designed frame is drawn). */
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** Describe the photo for screen readers (not just the name). */
  readonly alt: LocalizedText;
}

export interface SuccessStory {
  readonly id: string;
  /**
   * Publication gate. Must be true ONLY when the learner has consented to
   * publication of this exact content.
   */
  readonly isApproved: boolean;
  readonly studentName: LocalizedText;
  /** The story, in the learner's own words. */
  readonly story: LocalizedText;
  /** What the learner achieved, as they describe it. Optional. */
  readonly outcome?: LocalizedText;
  /** Optional role / occupation line. */
  readonly role?: LocalizedText;
  /** Optional category (for example the area they studied). */
  readonly category?: LocalizedText;
  /** Optional photo. */
  readonly image?: StoryImage;
}

/**
 * Public stories are loaded from MongoDB; this module intentionally contains
 * no testimonial content.
 */
/** No testimonials are fabricated. Stories must come from the approved CMS collection. */
export const SUCCESS_STORIES: readonly SuccessStory[] = [];

/**
 * A story is publishable only when it is approved and has a real name and
 * story text in the active locale. Everything else stays off the public page.
 */
export const isStoryPublishable = (story: SuccessStory, locale: string): boolean => {
  const active: StoryLocale = isStoryLocale(locale) ? locale : "en";
  return (
    story.isApproved &&
    hasRealText(story.studentName, active) &&
    hasRealText(story.story, active)
  );
};

/** Filter a list down to stories that may be shown publicly. */
export const getPublishableStories = (
  stories: readonly SuccessStory[],
  locale: string,
): SuccessStory[] => stories.filter((story) => isStoryPublishable(story, locale));

/* --------------------------------- Config --------------------------------- */

/** Carousel behaviour. Auto-slide is OFF by default (see notes in carousel). */
export const CAROUSEL_CONFIG = {
  /** Enable automatic sliding. A visible pause control appears when true. */
  autoPlay: false,
  /** Time each story stays on screen when auto-sliding. */
  autoPlayIntervalMs: 8000,
  /** Horizontal drag distance (px) that counts as a swipe. */
  swipeThresholdPx: 60,
  /** Slide travel distance (px); a short move, never a 3D flip. */
  slideOffsetPx: 48,
} as const;

/** Where the empty state sends visitors instead. */
export const EXPLORE_COURSES_HREF = "/courses" as const;