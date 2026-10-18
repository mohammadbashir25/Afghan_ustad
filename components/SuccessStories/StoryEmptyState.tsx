"use client";

/**
 * StoryEmptyState
 * ---------------------------------------------------------------------------
 * Shown while there are no approved stories. Designed as a real section, not
 * a blank: a calm message that explains stories are shared only with
 * permission, two useful next steps, and an invitation to contribute.
 * Nothing here pretends a story exists.
 */
import { useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Reveal } from "@/components/ui/Reveal";
import { StoryArt } from "./StoryArt";
import { STORIES_NAMESPACE, STORY_ROUTES } from "./data";
import s from "./success-stories.module.css";

export function StoryEmptyState() {
  const t = useTranslations(STORIES_NAMESPACE);

  return (
    <section className={`${s.section} ${s.empty}`}>
      <Container>
        <div className={s.emptyGrid}>
          <Reveal direction="up">
            <h2 className={s.emptyTitle}>{t("empty.title")}</h2>
            <p className={s.emptyText}>{t("empty.text")}</p>

            <div className={s.emptyActions}>
              <Button
                variant="primary"
                size="lg"
                href={STORY_ROUTES.courses}
                icon={<LuArrowRight className={s.dirIcon} aria-hidden="true" />}
              >
                {t("empty.primary")}
              </Button>
              <Button variant="outline" size="lg" href={STORY_ROUTES.skillCenter}>
                {t("empty.secondary")}
              </Button>
            </div>

            <Divider className={s.emptyDivider} />

            <h3 className={s.inviteTitle}>{t("empty.inviteTitle")}</h3>
            <p className={s.inviteText}>{t("empty.inviteText")}</p>
            <Button variant="ghost" size="md" href={STORY_ROUTES.contact}>
              {t("empty.inviteAction")}
            </Button>
          </Reveal>

          {/* Decorative: the same doorway illustration, on the white surface */}
          <Reveal direction="up" delay={0.15}>
            <StoryArt onWhite />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}