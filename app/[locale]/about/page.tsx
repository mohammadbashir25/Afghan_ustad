/**
 * About page  ->  /[locale]/about
 * ---------------------------------------------------------------------------
 * A server component that only composes the narrative, in order:
 *
 *   Identity            AboutHero
 *   Why we exist        AboutStory
 *   How we think        EducationalApproach
 *   What + how we learn LearningPhilosophy (focus, loop, Skill Center)
 *   What we stand for   AboutValues
 *   Next step           AboutCTA
 *
 * Every section is a client component (Framer Motion + next-intl hooks), so
 * this file stays free of UI logic. It returns a fragment because the site
 * layout already provides <main> and the header/footer.
 *
 * Metadata is localized through next-intl (`pages.about.meta`).
 */
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import AboutCTA from "@/components/About/AboutCTA";
import AboutHero from "@/components/About/AboutHero";
import AboutStory from "@/components/About/AboutStory";
import AboutValues from "@/components/About/AboutValues";
import EducationalApproach from "@/components/About/EducationalApproach";
import LearningPhilosophy from "@/components/About/LearningPhilosophy";

interface AboutPageProps {
  readonly params: Promise<{ locale: string }>;
}

/** Localized <title> and description. */
export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.about.meta" });
  return { title: t("title"), description: t("description") };
}

export default async function AboutPage({ params }: AboutPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  // Enables static rendering for this locale (next-intl).
  setRequestLocale(locale);

  return (
    <>
      <AboutHero />
      <AboutStory />
      <EducationalApproach />
      <LearningPhilosophy />
      <AboutValues />
      <AboutCTA />
    </>
  );
}
