/**
 * data.ts
 * ---------------------------------------------------------------------------
 * Story data, contracts and carousel configuration for the Success Stories
 * section.
 *
 * TRUST RULES (enforced in code, not just by convention)
 * - The three stories below are SAMPLE content so the section is complete
 *   during development. The people, quotes and outcomes are NOT real. Replace
 *   them with real, consented stories before launch (or set `isApproved:
 *   false` to hide a story; with none approved the section shows its
 *   designed empty state).
 * - No salaries, percentages, employers or before/after numbers are used.
 * - A story only reaches the public page when it is explicitly approved AND
 *   has a real name and story (`getPublishableStories`).
 *
 * Adding a real story = fill one object and set `isApproved: true`. The card,
 * carousel and layout need no changes. Text is per-locale (`LocalizedText`),
 * the same shape a CMS returns, so this array can later be replaced by
 * fetched data.
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
 * SAMPLE stories: replace every field marked SAMPLE with a real, approved
 * story. `image` is omitted on purpose; add
 * `image: { src, width, height, alt: {...} }` when a real photo exists.
 */
export const SUCCESS_STORIES: readonly SuccessStory[] = [
  {
    id: "story-1",
    isApproved: true, // SAMPLE
    studentName: { en: "Farzana Ahmadi", fa: "فرزانه احمدی", ps: "فرزانه احمدي" }, // SAMPLE
    role: { en: "Student", fa: "محصل", ps: "زده کوونکې" }, // SAMPLE
    category: {
      en: "Computer Fundamentals",
      fa: "مبانی کمپیوتر",
      ps: "د کمپیوټر بنسټونه",
    }, // SAMPLE
    story: {
      en: "I used to be nervous every time I opened a computer. The lessons explained each step in simple words, and the exercises let me try things without fear. Now I use it every day without thinking twice.",
      fa: "قبلاً هر بار که کمپیوتر را باز می‌کردم نگران بودم. درس‌ها هر مرحله را با کلمات ساده توضیح می‌دادند و تمرین‌ها اجازه می‌دادند بدون ترس امتحان کنم. حالا هر روز بدون فکر دوباره از آن استفاده می‌کنم.",
      ps: "پخوا هر ځل چې کمپیوټر پرانیستم اندیښمنه وم. درسونو هر ګام په ساده ټکو تشریح کاوه او تمرینونو ماته اجازه راکوله پرته له ویرې هڅه وکړم. اوس هره ورځ پرته له دوه فکره ترې کار اخلم.",
    }, // SAMPLE
    outcome: {
      en: "Now uses a computer confidently for study and daily tasks.",
      fa: "اکنون با اعتماد از کمپیوتر برای درس و کارهای روزمره استفاده می‌کند.",
      ps: "اوس د زده کړې او ورځنیو کارونو لپاره په ډاډ سره کمپیوټر کاروي.",
    }, // SAMPLE
  },
  {
    id: "story-2",
    isApproved: true, // SAMPLE
    studentName: { en: "Hamid Noori", fa: "حمید نوری", ps: "حمید نوري" }, // SAMPLE
    role: {
      en: "Beginner programmer",
      fa: "برنامه‌نویس مبتدی",
      ps: "پیلوونکی پروګرامر",
    }, // SAMPLE
    category: { en: "Programming", fa: "برنامه‌نویسی", ps: "پروګرامینګ" }, // SAMPLE
    story: {
      en: "I had tried learning to code from videos before, but I always got stuck. Here the lessons in my own language came with practice after every idea, so I finally understood why the code works, not just how to copy it.",
      fa: "پیش‌تر هم کوشیده بودم از روی ویدیوها برنامه‌نویسی یاد بگیرم، اما همیشه گیر می‌کردم. اینجا درس‌ها به زبان خودم بود و بعد از هر مفهوم تمرین داشت؛ بالاخره فهمیدم کد چرا کار می‌کند، نه فقط چطور کپی شود.",
      ps: "مخکې هم هڅه کړې وه چې له ویډیوګانو کوډ لیکل زده کړم، خو تل ګیر پاتې کېدم. دلته درسونه په خپله ژبه وو او د هر مفهوم وروسته تمرین راتلو؛ ورو ورو پوه شوم چې کوډ ولې کار کوي، نه یوازې دا چې څنګه یې کاپي کړم.",
    }, // SAMPLE
    outcome: {
      en: "Writes small Python programs on their own.",
      fa: "برنامه‌های کوچک پایتون را خودش می‌نویسد.",
      ps: "کوچني پایتون پروګرامونه پخپله لیکي.",
    }, // SAMPLE
  },
  {
    id: "story-3",
    isApproved: true, // SAMPLE
    studentName: { en: "Zarlasht Karimi", fa: "زرلشت کریمی", ps: "زرلشت کریمي" }, // SAMPLE
    role: { en: "Learner", fa: "یادگیرنده", ps: "زده کوونکې" }, // SAMPLE
    category: { en: "Web Development", fa: "توسعهٔ وب", ps: "د ویب پراختیا" }, // SAMPLE
    story: {
      en: "Building my first web page felt impossible at the start. Taking it one small step at a time, I ended up with a page I was proud to show my family.",
      fa: "ساختن اولین صفحهٔ وب در آغاز غیرممکن به نظر می‌رسید. با برداشتن گام‌های کوچک، بالاخره صفحه‌ای ساختم که با افتخار به خانواده‌ام نشان دادم.",
      ps: "د لومړۍ ویب‌پاڼې جوړول په پیل کې ناشوني ښکارېدل. په کوچنیو ګامونو سره داسې پاڼه مې جوړه کړه چې کورنۍ ته مې په ویاړ وښوده.",
    }, // SAMPLE
    outcome: {
      en: "Built a first complete web page.",
      fa: "نخستین صفحهٔ وب کامل خود را ساخته است.",
      ps: "خپله لومړۍ بشپړه ویب‌پاڼه یې جوړه کړې ده.",
    }, // SAMPLE
  },
] as const;

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