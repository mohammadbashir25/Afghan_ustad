/**
 * data.ts
 * ---------------------------------------------------------------------------
 * Course configuration for the landing-page Courses section.
 *
 * Content notes
 * - Courses below are written as a realistic beginner-to-intermediate
 *   technology catalog. Titles, summaries, levels, durations and lesson counts
 *   are editorial content: confirm each one matches what AfghanUstad really
 *   teaches before launch. No prices, instructors, student counts,
 *   certificates or outcome claims are included.
 * - `coverImage` still uses the `CLIENT_INPUT_REQUIRED` marker (never shown as
 *   text); an abstract on-brand cover is drawn until a real image is set.
 * - Course/category TEXT is stored per locale (`LocalizedText`), exactly the
 *   shape a CMS returns. UI chrome (headings, buttons, filter label, empty
 *   state, level names) lives in next-intl messages (`landing.courses`).
 * - The UI hides any meta value that is still the placeholder marker, so you
 *   can leave a field unset and it simply won't render.
 *
 * CMS migration: replace `COURSES` / `COURSE_CATEGORIES` with fetched data of
 * the same types and pass them to <Courses courses={...} categories={...} />.
 * Nothing else changes.
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
export const COURSES: readonly Course[] = [
  {
    id: "computer-basics",
    slug: "computer-basics",
    categoryId: "fundamentals",
    title: { en: "Computer Basics", fa: "مبانی کمپیوتر", ps: "د کمپیوټر بنسټونه" },
    summary: {
      en: "Learn how computers work and use them with confidence: files and folders, the internet, email, and everyday safety.",
      fa: "طرز کار کمپیوتر را بیاموزید و با اعتماد از آن استفاده کنید: فایل‌ها و پوشه‌ها، انترنت، ایمیل و امنیت روزمره.",
      ps: "د کمپیوټر د کار طریقه زده کړئ او په ډاډ ترې کار واخلئ: فایلونه او فولډرونه، انټرنېټ، بریښنالیک او ورځنی خوندیتوب.",
    },
    level: "beginner",
    duration: { en: "4 weeks", fa: "۴ هفته", ps: "۴ اونۍ" },
    lessonCount: 16,
    coverImage: CLIENT_INPUT_REQUIRED,
    coverVariant: "lattice",
    isFeatured: true,
  },
  {
    id: "python-for-beginners",
    slug: "python-for-beginners",
    categoryId: "programming",
    title: {
      en: "Python Programming for Beginners",
      fa: "برنامه‌نویسی پایتون برای مبتدیان",
      ps: "د پیلوونکو لپاره پایتون پروګرامینګ",
    },
    summary: {
      en: "Start programming with Python. Write real programs step by step, from variables and loops to functions and small projects.",
      fa: "برنامه‌نویسی را با پایتون آغاز کنید. برنامه‌های واقعی را گام به گام بنویسید، از متغیرها و حلقه‌ها تا توابع و پروژه‌های کوچک.",
      ps: "پروګرامینګ د پایتون سره پیل کړئ. ریښتینې پروګرامونه ګام په ګام ولیکئ، له متغیرونو او لوپونو تر فنکشنونو او کوچنیو پروژو پورې.",
    },
    level: "beginner",
    duration: { en: "8 weeks", fa: "۸ هفته", ps: "۸ اونۍ" },
    lessonCount: 30,
    coverImage: CLIENT_INPUT_REQUIRED,
    coverVariant: "path",
    isFeatured: false,
  },
  {
    id: "html-css-first-website",
    slug: "html-css-first-website",
    categoryId: "web",
    title: {
      en: "Build Your First Website with HTML & CSS",
      fa: "نخستین وب‌سایت خود را با HTML و CSS بسازید",
      ps: "خپل لومړی ویب‌پاڼه په HTML او CSS جوړه کړئ",
    },
    summary: {
      en: "Create a complete web page from scratch. Learn page structure, styling and layout while building something you can show.",
      fa: "یک صفحهٔ وب کامل را از صفر بسازید. ساختار صفحه، استایل و چیدمان را بیاموزید و چیزی بسازید که بتوانید نشان بدهید.",
      ps: "یوه بشپړه ویب‌پاڼه له صفر جوړه کړئ. د پاڼې جوړښت، سټایل او ترتیب زده کړئ او داسې څه جوړ کړئ چې وکولای شئ وښیئ.",
    },
    level: "beginner",
    duration: { en: "6 weeks", fa: "۶ هفته", ps: "۶ اونۍ" },
    lessonCount: 24,
    coverImage: CLIENT_INPUT_REQUIRED,
    coverVariant: "grid",
    isFeatured: false,
  },
  {
    id: "office-essentials",
    slug: "office-essentials",
    categoryId: "fundamentals",
    title: {
      en: "Microsoft Office Essentials",
      fa: "اصول اساسی مایکروسافت آفیس",
      ps: "د مایکروسافټ آفیس اړین مهارتونه",
    },
    summary: {
      en: "Get comfortable with the documents, spreadsheets and presentations used in study and work.",
      fa: "با اسناد، جدول‌های محاسباتی و پرزنتیشن‌هایی که در درس و کار استفاده می‌شوند آشنا شوید.",
      ps: "د زده کړې او کار په بهیر کې کارېدونکو اسنادو، سپریډشیټونو او پریزنټېشنونو سره بلد شئ.",
    },
    level: "beginner",
    duration: { en: "3 weeks", fa: "۳ هفته", ps: "۳ اونۍ" },
    lessonCount: 12,
    coverImage: CLIENT_INPUT_REQUIRED,
    coverVariant: "rings",
    isFeatured: false,
  },
  {
    id: "javascript-fundamentals",
    slug: "javascript-fundamentals",
    categoryId: "programming",
    title: {
      en: "JavaScript Fundamentals",
      fa: "مبانی جاوااسکریپت",
      ps: "د جاواسکریپټ بنسټونه",
    },
    summary: {
      en: "Make web pages interactive. Learn the core of JavaScript through exercises on logic, events and working with data.",
      fa: "صفحه‌های وب را تعاملی بسازید. هستهٔ جاوااسکریپت را از راه تمرین‌های منطق، رویدادها و کار با داده بیاموزید.",
      ps: "ویب‌پاڼې متقابلې کړئ. د جاواسکریپټ اصلي برخې د منطق، پېښو او ډیټا سره د کار په تمرینونو زده کړئ.",
    },
    level: "intermediate",
    duration: { en: "8 weeks", fa: "۸ هفته", ps: "۸ اونۍ" },
    lessonCount: 28,
    coverImage: CLIENT_INPUT_REQUIRED,
    coverVariant: "lattice",
    isFeatured: false,
  },
  {
    id: "git-and-github-basics",
    slug: "git-and-github-basics",
    categoryId: "web",
    title: {
      en: "Git and GitHub Basics",
      fa: "مبانی گیت و گیت‌هاب",
      ps: "د ګیټ او ګیټ‌هب بنسټونه",
    },
    summary: {
      en: "Track your work and collaborate safely. Learn version control from your first commit to sharing a project online.",
      fa: "کار خود را پیگیری کنید و با دیگران امن همکاری کنید. کنترل نسخه را از نخستین کامیت تا انتشار آنلاین پروژه بیاموزید.",
      ps: "خپل کار تعقیب کړئ او له نورو سره په خوندي ډول همکاري وکړئ. د نسخو کنټرول له لومړي کامیټ څخه تر پروژې آنلاین شریکولو زده کړئ.",
    },
    level: "intermediate",
    duration: { en: "2 weeks", fa: "۲ هفته", ps: "۲ اونۍ" },
    lessonCount: 10,
    coverImage: CLIENT_INPUT_REQUIRED,
    coverVariant: "grid",
    isFeatured: false,
  },
] as const;

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