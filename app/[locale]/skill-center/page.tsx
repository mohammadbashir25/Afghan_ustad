/**
 * /[locale]/skill-center
 * ---------------------------------------------------------------------------
 * Composes the story in order:
 * Hero → what it is → why practice matters → how practice is supported →
 * the whole journey → courses ⇄ Skill Center → CTA.
 */
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SkillCenterHero } from "@/components/SkillCenter/SkillCenterHero";
import { SkillCenterOverview } from "@/components/SkillCenter/SkillCenterOverview";
import { PracticeExperience } from "@/components/SkillCenter/PracticeExperience";
import { GuidanceSystem } from "@/components/SkillCenter/GuidanceSystem";
import { ProgressJourney } from "@/components/SkillCenter/ProgressJourney";
import { CourseToSkill } from "@/components/SkillCenter/CourseToSkill";
import { SkillCenterCTA } from "@/components/SkillCenter/SkillCenterCTA";
import { SKILL_NAMESPACE } from "@/components/SkillCenter/data";

interface SkillCenterPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SkillCenterPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: `${SKILL_NAMESPACE}.meta` });
  return { title: t("title"), description: t("description") };
}

export default async function SkillCenterPage({ params }: SkillCenterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <SkillCenterHero />
      <SkillCenterOverview />
      <PracticeExperience />
      <GuidanceSystem />
      <ProgressJourney />
      <CourseToSkill />
      <SkillCenterCTA />
    </main>
  );
}
