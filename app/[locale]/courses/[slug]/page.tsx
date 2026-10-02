/**
 * /[locale]/courses/[slug]
 * ---------------------------------------------------------------------------
 * Course detail route. The folder name "[slug]" makes `slug` a dynamic
 * segment: /en/courses/python-programming → params = { locale:"en",
 * slug:"python-programming" }.
 *
 *  - generateStaticParams  → pre-builds every locale × slug at build time
 *  - generateMetadata      → per-course <title> / description
 *  - notFound()            → unknown slug renders the 404 page
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CourseDetail } from "./CourseDetail";
import {
  LOCALES,
  getCourseBySlug,
  getCourses,
  getRelatedCourses,
  localize,
} from "./data";

interface CourseDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Tell Next which pages exist so they are generated ahead of time. */
export async function generateStaticParams() {
  const courses = await getCourses();
  return LOCALES.flatMap((locale) =>
    courses.map((course) => ({ locale, slug: course.slug })),
  );
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {}; // page itself will 404

  return {
    title: `${localize(course.title, locale)} | AfghanUstad`,
    description: localize(course.description, locale),
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const related = await getRelatedCourses(course);

  // schema.org structured data helps search engines understand the page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: localize(course.title, locale),
    description: localize(course.description, locale),
    provider: { "@type": "Organization", name: "AfghanUstad" },
  };

  return (
    <main className="mt-10">
      <script
        type="application/ld+json"
        // "<" is escaped so content can never close the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <CourseDetail course={course} related={related} />
    </main>
  );
}
