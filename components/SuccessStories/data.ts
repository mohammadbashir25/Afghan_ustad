/**
 * Success Stories — data layer
 * ---------------------------------------------------------------------------
 * !! PLACEHOLDER CONTENT !!  Every story below is a SAMPLE written to preview
 * the layout. Names, quotes and outcomes are NOT real learners. Replace them
 * with real, approved stories (or return them from a CMS inside getStories())
 * before launch. If you delete them all, the page automatically shows its
 * designed empty state.
 *
 * Almost every field is optional (see types.ts) — the samples deliberately
 * leave some out (no photo, no date, no course…) to show how cards adapt.
 */
import type { Locale, LocalizedText, SuccessStory } from "./types";

export const STORIES_NAMESPACE = "successStories" as const;

/** Locale-free routes; the shared Button adds the locale prefix itself. */
export const STORY_ROUTES = {
  courses: "/courses",
  skillCenter: "/skill-center",
  contact: "/contact",
} as const;


/* Shared labels reused by the samples. */
const CAT_FOUNDATIONS = {
  id: "foundations",
  label: { en: "Computer basics", fa: "مبانی کامپیوتر", ps: "د کمپیوټر بنسټونه" },
} as const;
const CAT_PROGRAMMING = {
  id: "programming",
  label: { en: "Programming", fa: "برنامه‌نویسی", ps: "پروګرامینګ" },
} as const;
const CAT_WEB = {
  id: "web",
  label: { en: "Web", fa: "وب", ps: "ویب" },
} as const;

/** PLACEHOLDER stories — replace with real, approved ones. */
const STORIES: readonly SuccessStory[] = [
  {
    // Featured: has a name, story, course, category, result, year and a path.
    id: "sample-1",
    slug: "sample-computer-basics",
    approved: true,
    featured: true,
    studentName: { en: "Mariam Ahmadi", fa: "مریم احمدی", ps: "مریم احمدي" },
    story: {
      en: "I had never used a computer before. The lessons were short, so I could understand one idea before moving to the next. Now I can organise my files and use the internet with confidence.",
      fa: "پیش از این هرگز از کامپیوتر استفاده نکرده بودم. درس‌ها کوتاه بودند و می‌توانستم پیش از رفتن به مفهوم بعدی، یک مفهوم را کامل بفهمم. حالا می‌توانم فایل‌هایم را منظم کنم و با اطمینان از اینترنت استفاده کنم.",
      ps: "مخکې مې هیڅکله کمپیوټر نه و کارولی. درسونه لنډ وو، نو مې کولی شول مخکې له بل مفهوم یو مفهوم بشپړ وپېژنم. اوس کولی شم فایلونه منظم کړم او په ډاډ سره انټرنیټ وکاروم.",
    },
    course: {
      slug: "computer-basics",
      title: { en: "Computer Basics", fa: "مبانی کامپیوتر", ps: "د کمپیوټر بنسټونه" },
    },
    category: CAT_FOUNDATIONS,
    result: {
      en: "Can now do everyday tasks on a computer on her own.",
      fa: "اکنون می‌تواند کارهای روزمره را خودش با کامپیوتر انجام دهد.",
      ps: "اوس کولی شي ورځني کارونه پخپله په کمپیوټر ترسره کړي.",
    },
    date: "2026-02-10",
    learningPath: [
      { en: "Computer Basics", fa: "مبانی کامپیوتر", ps: "د کمپیوټر بنسټونه" },
      { en: "Microsoft Office Essentials", fa: "مبانی مایکروسافت آفیس", ps: "د مایکروسافټ آفس بنسټونه" },
    ],
  },
  {
    id: "sample-2",
    slug: "sample-python",
    approved: true,
    studentName: { en: "Hamid Rahimi", fa: "حمید رحیمی", ps: "حمید رحیمي" },
    story: {
      en: "Python felt difficult until I started practising every day. Writing small programs myself helped more than only watching the lessons.",
      fa: "پایتون تا وقتی هر روز تمرین نکردم دشوار به نظر می‌رسید. نوشتن برنامه‌های کوچک با دست خودم بیشتر از فقط تماشای درس‌ها کمکم کرد.",
      ps: "پایتون تر هغه مهاله ستونزمن ښکارېده چې هره ورځ مې تمرین نه و کړی. د کوچنیو پروګرامونو پخپله لیکل زما سره تر یوازې د درسونو کتلو ډېره مرسته وکړه.",
    },
    course: {
      slug: "python-programming",
      title: { en: "Python Programming", fa: "برنامه‌نویسی با پایتون", ps: "د پایتون پروګرامینګ" },
    },
    category: CAT_PROGRAMMING,
    result: {
      en: "Wrote his first small program from scratch.",
      fa: "نخستین برنامهٔ کوچک خود را از صفر نوشت.",
      ps: "خپل لومړی کوچنی پروګرام له سره پخپله ولیکه.",
    },
    date: "2026-03-05",
  },
  {
    id: "sample-3",
    slug: "sample-html-css",
    approved: true,
    studentName: { en: "Zahra Karimi", fa: "زهرا کریمی", ps: "زهرا کریمي" },
    story: {
      en: "I wanted to build a page for my family's shop. Step by step, I learned how to structure it and style it.",
      fa: "می‌خواستم برای مغازهٔ خانواده‌ام یک صفحه بسازم. گام‌به‌گام یاد گرفتم چطور آن را ساختار بدهم و طراحی کنم.",
      ps: "غوښتل مې د کورنۍ د دوکان لپاره یوه پاڼه جوړه کړم. ګام په ګام مې زده کړل چې څنګه یې جوړښت ورکړم او ډیزاین یې کړم.",
    },
    course: {
      slug: "html-css-web-design",
      title: { en: "HTML & CSS Web Design", fa: "طراحی وب با HTML و CSS", ps: "د HTML او CSS ویب ډیزاین" },
    },
    category: CAT_WEB,
    result: {
      en: "Built a simple web page for a family business.",
      fa: "برای کسب‌وکار خانوادگی یک صفحهٔ وب ساده ساخت.",
      ps: "د کورنۍ د کار لپاره یې یوه ساده ویب پاڼه جوړه کړه.",
    },
    date: "2026-04-02",
  },
  {
    // No result, no date: card shows only what exists.
    id: "sample-4",
    slug: "sample-git",
    approved: true,
    studentName: { en: "Farid Noori", fa: "فرید نوری", ps: "فرید نوري" },
    story: {
      en: "Before this course I kept copies of my files with names like “final-final”. Git showed me a cleaner way to save my work.",
      fa: "پیش از این کورس، از فایل‌هایم نسخه‌هایی با نام‌هایی مثل «نهایی‌نهایی» نگه می‌داشتم. Git راه مرتب‌تری برای ذخیره کردن کارم به من نشان داد.",
      ps: "د دې کورس نه مخکې، د خپلو فایلونو نسخې مې د «وروستی‌وروستی» په څېر نومونو سره ساتلې. Git ماته د خپل کار د خوندي کولو یوه منظمه لار وښودله.",
    },
    course: {
      slug: "git-github-basics",
      title: { en: "Git & GitHub Basics", fa: "مبانی Git و GitHub", ps: "د Git او GitHub بنسټونه" },
    },
    category: CAT_PROGRAMMING,
  },
  {
    // No course, no result: story + name + year only.
    id: "sample-5",
    slug: "sample-practice",
    approved: true,
    studentName: { en: "Nilofar Safi", fa: "نیلوفر صافی", ps: "نیلوفر صافي" },
    story: {
      en: "The practice sessions helped me understand what the lessons meant. The tasks gave me a reason to use each tool.",
      fa: "جلسه‌های تمرین به من کمک کرد بفهمم درس‌ها چه معنایی دارند. تکلیف‌ها دلیلی به من می‌دادند تا از هر ابزار استفاده کنم.",
      ps: "د تمرین ناستو ماته مرسته وکړه چې پوه شم درسونه څه معنا لري. دندو ماته د هر وسیلې د کارولو دلیل راکړ.",
    },
    category: CAT_FOUNDATIONS,
    date: "2026-05-18",
  },
];

/** Data seam: replace with a CMS / DB call later. */
export async function getStories(): Promise<readonly SuccessStory[]> {
  return STORIES;
}

/** Only approved stories are ever shown. */
export function getApproved(stories: readonly SuccessStory[]): SuccessStory[] {
  return stories.filter((s) => s.approved);
}

const LOCALES: readonly Locale[] = ["en", "fa", "ps"];

/** Picks the right translation, falling back to English. */
export function localize(text: LocalizedText, locale: string): string {
  return (LOCALES as readonly string[]).includes(locale)
    ? text[locale as Locale]
    : text.en;
}

/**
 * Year only, with Latin digits pinned. Full month names can differ between
 * server and browser ICU data for fa/ps and would break hydration.
 */
export function formatStoryYear(iso: string, locale: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(`${locale}-u-ca-gregory-nu-latn`, {
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}