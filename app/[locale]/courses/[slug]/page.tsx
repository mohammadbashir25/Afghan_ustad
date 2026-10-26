import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { CourseDetail } from "./CourseDetail";
import {
  LOCALES,
  getCourseBySlug,
  getCourses,
  getRelatedCourses,
  localize,
} from "./data";

interface CourseDetailPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

/**
 * Generate only the known locale + course slug combinations.
 */
export const dynamicParams = false;

/**
 * Build course pages at build time.
 */
export async function generateStaticParams() {
  const courses = await getCourses();

  return LOCALES.flatMap((locale) =>
    courses.map((course) => ({
      locale,
      slug: course.slug,
    })),
  );
}

/**
 * Deduplicate identical course lookups within a render.
 */
const getCourse = cache(async (slug: string) => {
  return getCourseBySlug(slug);
});

/**
 * SEO metadata for each course.
 */
export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  const course = await getCourse(slug);

  if (!course) {
    return {
      title: "Course Not Found | AfghanUstad",
    };
  }

  return {
    title: `${localize(course.title, locale)} | AfghanUstad`,
    description: localize(course.description, locale),
  };
}

/**
 * Course detail page.
 */
export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  const related = await getRelatedCourses(course);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: localize(course.title, locale),
    description: localize(course.description, locale),
    provider: {
      "@type": "Organization",
      name: "AfghanUstad",
    },
  };

  return (
    <main className="mt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <CourseDetail course={course} related={related} />
    </main>
  );
}
