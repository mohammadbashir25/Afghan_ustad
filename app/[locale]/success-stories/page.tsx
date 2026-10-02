/**
 * /[locale]/success-stories
 * ---------------------------------------------------------------------------
 * Server component. Loads stories (empty today), keeps only APPROVED ones and
 * composes the page:
 *   Hero → Featured story (if any) → Collection (if any) OR designed empty
 *   state → Journey context → CTA
 */
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SuccessStoriesHero } from "@/components/SuccessStories/SuccessStoriesHero";
import { FeaturedStory } from "@/components/SuccessStories/FeaturedStory";
import { StoriesGrid } from "@/components/SuccessStories/StoriesGrid";
import { StoryEmptyState } from "@/components/SuccessStories/StoryEmptyState";
import { StoryContext } from "@/components/SuccessStories/StoryContext";
import { SuccessStoriesCTA } from "@/components/SuccessStories/SuccessStoriesCTA";
import {
  STORIES_NAMESPACE,
  getApproved,
  getStories,
} from "@/components/SuccessStories/data";

interface SuccessStoriesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SuccessStoriesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: `${STORIES_NAMESPACE}.meta` });
  return { title: t("title"), description: t("description") };
}

export default async function SuccessStoriesPage({ params }: SuccessStoriesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const approved = getApproved(await getStories());
  const featured = approved.find((s) => s.featured);
  const rest = approved.filter((s) => s.id !== featured?.id);

  return (
    <main>
      <SuccessStoriesHero />
      {featured && <FeaturedStory story={featured} />}
      {rest.length > 0 && <StoriesGrid stories={rest} />}
      {approved.length === 0 && <StoryEmptyState />}
      <StoryContext />
      <SuccessStoriesCTA />
    </main>
  );
}
