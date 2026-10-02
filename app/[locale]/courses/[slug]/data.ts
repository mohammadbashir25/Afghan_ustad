/**
 * Courses page — data layer
 * ---------------------------------------------------------------------------
 * PLACEHOLDER catalog (edit freely). `getCourses()` is the single seam to
 * replace with a CMS / database call; everything else consumes `Course[]`.
 * UI labels (categories, levels, guidance) are next-intl keys, never copy.
 */
import type {
  Course,
  CourseCategory,
  CourseLevel,
  Locale,
  LocalizedText,
} from "@/components/courses/types";

/** next-intl namespace for the whole page. */
export const COURSES_NAMESPACE = "coursesPage" as const;

/** Display order for filter chips (only options present in data are shown). */
export const CATEGORY_ORDER: readonly CourseCategory[] = [
  "computerBasics",
  "programming",
  "web",
  "productivity",
];
export const LEVEL_ORDER: readonly CourseLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
];

/** Guidance steps — copy lives under `guidance.steps.<id>` in messages. */
export const GUIDANCE_STEP_IDS = ["choose", "review", "enroll"] as const;

/** Adjust to your real routes. Locale prefix is added by the components. */
export const CTA_LINKS = { enroll: "/enroll", contact: "/contact" } as const;

export const LOCALES: readonly Locale[] = ["en", "fa", "ps"];

/** Picks the right translation, falling back to English. */
export function localize(text: LocalizedText, locale: string): string {
  return (LOCALES as readonly string[]).includes(locale)
    ? text[locale as Locale]
    : text.en;
}

const PLACEHOLDER_COURSES: readonly Course[] = [
  {
    id: "c1",
    slug: "computer-basics",
    category: "computerBasics",
    level: "beginner",
    status: "open",
    durationWeeks: 6,
    featured: true,
    title: { en: "Computer Basics", fa: "مبانی کامپیوتر", ps: "د کمپیوټر بنسټونه" },
    description: {
      en: "Learn how computers work and get confident with files, folders, the internet and everyday tools.",
      fa: "با طرز کار کامپیوتر آشنا شوید و در کار با فایل‌ها، پوشه‌ها، اینترنت و ابزارهای روزمره مطمئن شوید.",
      ps: "پوه شئ چې کمپیوټر څنګه کار کوي او له فایلونو، فولډرونو، انټرنیټ او ورځنیو وسیلو سره ډاډه شئ.",
    },
  },
  {
    id: "c2",
    slug: "python-programming",
    category: "programming",
    level: "beginner",
    status: "open",
    durationWeeks: 8,
    title: { en: "Python Programming", fa: "برنامه‌نویسی با پایتون", ps: "د پایتون پروګرامینګ" },
    description: {
      en: "Start programming with Python: variables, logic, functions and small programs you write yourself.",
      fa: "برنامه‌نویسی را با پایتون شروع کنید: متغیرها، منطق، توابع و برنامه‌های کوچکی که خودتان می‌نویسید.",
      ps: "له پایتون سره پروګرامینګ پیل کړئ: متغیرونه، منطق، فنکشنونه او کوچني پروګرامونه چې پخپله یې لیکئ.",
    },
  },
  {
    id: "c3",
    slug: "html-css-web-design",
    category: "web",
    level: "beginner",
    status: "open",
    durationWeeks: 6,
    title: { en: "HTML & CSS Web Design", fa: "طراحی وب با HTML و CSS", ps: "د HTML او CSS ویب ډیزاین" },
    description: {
      en: "Build and style your first web pages with clean, structured HTML and CSS.",
      fa: "نخستین صفحه‌های وب خود را با HTML و CSS منظم بسازید و طراحی کنید.",
      ps: "خپلې لومړۍ ویب پاڼې د منظم HTML او CSS په مرسته جوړې او ډیزاین کړئ.",
    },
  },
  {
    id: "c4",
    slug: "javascript-basics",
    category: "web",
    level: "intermediate",
    status: "open",
    durationWeeks: 8,
    title: { en: "JavaScript Basics", fa: "مبانی جاوااسکریپت", ps: "د جاواسکریپټ بنسټونه" },
    description: {
      en: "Make web pages interactive by learning the core ideas of JavaScript step by step.",
      fa: "با یادگیری گام‌به‌گام مفاهیم اصلی جاوااسکریپت، صفحه‌های وب را تعاملی کنید.",
      ps: "د جاواسکریپټ اصلي مفهومونه ګام په ګام زده کړئ او ویب پاڼې متقابلې کړئ.",
    },
  },
  {
    id: "c5",
    slug: "git-github-basics",
    category: "programming",
    level: "intermediate",
    status: "open",
    durationWeeks: 4,
    title: { en: "Git & GitHub Basics", fa: "مبانی Git و GitHub", ps: "د Git او GitHub بنسټونه" },
    description: {
      en: "Track changes, save versions of your work and share projects using Git and GitHub.",
      fa: "با Git و GitHub تغییرات را دنبال کنید، نسخه‌های کارتان را ذخیره کنید و پروژه‌ها را به اشتراک بگذارید.",
      ps: "د Git او GitHub په مرسته بدلونونه تعقیب کړئ، د کار نسخې خوندي کړئ او پروژې شریکې کړئ.",
    },
  },
  {
    id: "c6",
    slug: "microsoft-office-essentials",
    category: "productivity",
    level: "beginner",
    status: "open",
    durationWeeks: 6,
    title: { en: "Microsoft Office Essentials", fa: "مبانی مایکروسافت آفیس", ps: "د مایکروسافټ آفس بنسټونه" },
    description: {
      en: "Write documents, organise data and prepare presentations with confidence.",
      fa: "اسناد بنویسید، داده‌ها را منظم کنید و ارائه‌ها را با اطمینان آماده کنید.",
      ps: "اسناد ولیکئ، معلومات منظم کړئ او وړاندیزونه په ډاډ سره چمتو کړئ.",
    },
  },
  {
    id: "c7",
    slug: "spreadsheets-for-everyday-work",
    category: "productivity",
    level: "intermediate",
    status: "comingSoon",
    durationWeeks: 5,
    title: { en: "Spreadsheets for Everyday Work", fa: "صفحه‌گسترده برای کارهای روزمره", ps: "د ورځني کار لپاره سپریډشیټ" },
    description: {
      en: "Use formulas, tables and charts to organise numbers and make sense of them.",
      fa: "با فرمول‌ها، جدول‌ها و نمودارها اعداد را منظم کنید و معنای آن‌ها را بفهمید.",
      ps: "د فورمولونو، جدولونو او چارټونو په مرسته شمېرې منظم کړئ او معنا یې وپېژنئ.",
    },
  },
];

/**
 * Data seam: replace the body with a CMS / DB fetch. Kept async so the page
 * (a server component) doesn't change when real data arrives.
 */
export async function getCourses(): Promise<readonly Course[]> {
  return PLACEHOLDER_COURSES;
}

/** Looks up one course by its URL slug. Returns undefined when not found. */
export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  const courses = await getCourses();
  return courses.find((c) => c.slug === slug);
}

/** Same-topic courses first, then the rest, excluding the current one. */
export async function getRelatedCourses(course: Course, limit = 3): Promise<Course[]> {
  const others = (await getCourses()).filter((c) => c.id !== course.id);
  const sameTopic = others.filter((c) => c.category === course.category);
  const rest = others.filter((c) => c.category !== course.category);
  return [...sameTopic, ...rest].slice(0, limit);
}
