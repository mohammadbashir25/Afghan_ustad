
import type { MetadataRoute } from "next";
import { getCourses } from "@/components/courses/data";

const baseUrl = "https://www.afghanustad.com";

const locales = ["en", "fa", "ps"] as const;

const publicPages = [
  {
    path: "",
    changeFrequency: "weekly" as const,
    priority: 1,
  },
  {
    path: "about",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    path: "courses",
    changeFrequency: "weekly" as const,
    priority: 0.9,
  },
  {
    path: "skill-center",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    path: "success-stories",
    changeFrequency: "weekly" as const,
    priority: 0.7,
  },
  {
    path: "contact",
    changeFrequency: "monthly" as const,
    priority: 0.6,
  },
];

function localizedUrl(locale: string, path: string) {
  return `${baseUrl}/${locale}${path ? `/${path}` : ""}`;
}

// Generate the sitemap at request time so active course URLs
// can be obtained from the current MongoDB course catalogue.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pageEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    publicPages.map((page) => ({
      url: localizedUrl(locale, page.path),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((language) => [
            language,
            localizedUrl(language, page.path),
          ]),
        ),
      },
    })),
  );

  let courses: Awaited<ReturnType<typeof getCourses>> = [];

  try {
    courses = await getCourses();
  } catch (error) {
    console.error("Could not load courses for sitemap:", error);
  }

  const courseEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    courses.map((course) => ({
      url: localizedUrl(locale, `courses/${course.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((language) => [
            language,
            localizedUrl(language, `courses/${course.slug}`),
          ]),
        ),
      },
    })),
  );

  return [...pageEntries, ...courseEntries];
}
