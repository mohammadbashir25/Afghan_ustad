import type { Locale, LocalizedText, SuccessStory } from "./types";

/** Client-safe presentation constants and helpers. Database access lives in server-data.ts. */
export const STORIES_NAMESPACE = "successStories" as const;
export const STORY_ROUTES = { courses: "/courses", skillCenter: "/skill-center", contact: "/contact" } as const;
export function getApproved(stories: readonly SuccessStory[]): SuccessStory[] {
  return stories.filter((story) => story.approved && Boolean(story.studentName?.en?.trim()) && Boolean(story.story?.en?.trim()));
}
const LOCALES: readonly Locale[] = ["en", "fa", "ps"];
export function localize(text: LocalizedText, locale: string): string {
  return (LOCALES as readonly string[]).includes(locale) ? text[locale as Locale] : text.en;
}
export function formatStoryYear(iso: string, locale: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(`${locale}-u-ca-gregory-nu-latn`, { year: "numeric", timeZone: "UTC" }).format(date);
}
