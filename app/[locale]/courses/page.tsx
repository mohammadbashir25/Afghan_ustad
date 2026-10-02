/**
 * /[locale]/courses
 * ---------------------------------------------------------------------------
 * Server component: loads the catalog (placeholder now, CMS/DB later via
 * getCourses) and composes the page. All interactivity lives in the client
 * components below it.
 */
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CoursesHero } from "@/components/courses/CoursesHero";
import { CourseDiscovery } from "@/components/courses/CourseDiscovery";
import { EnrollmentGuidance } from "@/components/courses/EnrollmentGuidance";
import { CoursesCTA } from "@/components/courses/CoursesCTA";
import { COURSES_NAMESPACE, getCourses } from "@/components/courses/data";

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CoursesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: `${COURSES_NAMESPACE}.meta` });
  return { title: t("title"), description: t("description") };
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale); // enables static rendering with next-intl

  const courses = await getCourses();
  const categoryCount = new Set(courses.map((c) => c.category)).size;
  const levelCount = new Set(courses.map((c) => c.level)).size;

  return (
    <main>
      <CoursesHero
        courseCount={courses.length}
        categoryCount={categoryCount}
        levelCount={levelCount}
      />
      <CourseDiscovery courses={courses} />
      <EnrollmentGuidance />
      <CoursesCTA />
    </main>
  );
}
