"use client";

/**
 * SuccessStoriesHero
 * ---------------------------------------------------------------------------
 * Human, editorial opener. Text on one side; on the other the StoryArt illustration
 * (doorway, rising sun, steps) — purely illustrative, no people, quotes or
 * numbers. Works identically
 * whether or not stories exist.
 */
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { StoryArt } from "./StoryArt";
import { STORIES_NAMESPACE } from "./data";
import s from "./success-stories.module.css";

export function SuccessStoriesHero() {
  const t = useTranslations(STORIES_NAMESPACE);

  return (
    <section className={`${s.section} ${s.hero}`}>
      <Container>
        <div className={s.heroGrid}>
          <div>
            <Reveal direction="up">
              <Badge variant="accent">{t("hero.eyebrow")}</Badge>
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h1 className={s.heroTitle}>{t("hero.title")}</h1>
            </Reveal>
            <Reveal direction="up" delay={0.16}>
              <p className={s.heroLead}>{t("hero.lead")}</p>
            </Reveal>
          </div>

          {/* Decorative illustration (aria-hidden, carries no information) */}
          <Reveal direction="up" delay={0.2}>
            <StoryArt />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}