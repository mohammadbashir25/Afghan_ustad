"use client";

/**
 * StoryContext
 * ---------------------------------------------------------------------------
 * "What a learning journey looks like here" — three steps (start, practice,
 * grow) separated by vertical Dividers on desktop. It gives the page value
 * even before stories exist, and links to the real Courses / Skill Center
 * pages. No outcomes are promised.
 */
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Reveal } from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { useFormatNumber } from "@/components/shared/format-number";
import { STORIES_NAMESPACE, STORY_ROUTES } from "./data";
import s from "./success-stories.module.css";

/** Structure only; copy comes from `context.steps.<id>` in messages. */
const STEPS = [
  { id: "start", href: STORY_ROUTES.courses, hasLink: true },
  { id: "practice", href: STORY_ROUTES.skillCenter, hasLink: true },
  { id: "grow", href: "", hasLink: false },
] as const;

export function StoryContext() {
  const t = useTranslations(STORIES_NAMESPACE);
  const formatNumber = useFormatNumber();

  return (
    <section className={`${s.section} ${s.context}`}>
      <Container>
        <Reveal direction="up">
          <SectionHeading
            align="left"
            eyebrow={t("context.eyebrow")}
            title={t("context.title")}
            description={t("context.description")}
          />
        </Reveal>

        <Stagger>
          <div className={s.steps}>
            {STEPS.map((step, i) => (
              <StaggerItem key={step.id}>
                <div className={s.step}>
                  {i > 0 && <Divider orientation="vertical" className={s.stepDivider} />}
                  <div className={s.stepBody}>
                    <span className={s.stepNum}>
                      {formatNumber(i + 1, { minimumIntegerDigits: 2 })}
                    </span>
                    <h3 className={s.stepTitle}>{t(`context.steps.${step.id}.title`)}</h3>
                    <p className={s.stepText}>{t(`context.steps.${step.id}.text`)}</p>
                    {step.hasLink && (
                      <Button variant="ghost" size="sm" href={step.href}>
                        {t(`context.steps.${step.id}.link`)}
                      </Button>
                    )}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </div>
        </Stagger>
      </Container>
    </section>
  );
}
