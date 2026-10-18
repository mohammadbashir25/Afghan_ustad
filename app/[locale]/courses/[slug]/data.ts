import type { Course } from "@/components/courses/types";
import { getCourses } from "@/components/courses/data";
export { LOCALES, localize, COURSES_NAMESPACE, CTA_LINKS } from "./catalog";
export { getCourses } from "@/components/courses/data";
export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  const courses = await getCourses();
  return courses.find((course) => course.slug === slug);
}
export async function getRelatedCourses(course: Course, limit = 3): Promise<Course[]> {
  const courses = await getCourses();
  return courses.filter((item) => item.slug !== course.slug && item.category === course.category).slice(0, limit);
}
