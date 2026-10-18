"use client";

/**
 * SuccessStoriesCTA
 * ---------------------------------------------------------------------------
 * Closing invitation on a light panel (so shared Button variants keep their
 * contrast): share your story, or explore courses. Makes the approval
 * promise explicit.
 */
import { useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { STORIES_NAMESPACE, STORY_ROUTES } from "./data";
import s from "./success-stories.module.css";

export function SuccessStoriesCTA() {
  const t = useTranslations(STORIES_NAMESPACE);

  return (
    <section className={`${s.section} ${s.cta}`}>
      <Container>
        <Reveal direction="up">
          <div className={s.ctaPanel}>
            <div>
              <h2 className={s.ctaTitle}>{t("cta.title")}</h2>
              <p className={s.ctaText}>{t("cta.text")}</p>
            </div>
            <div className={s.ctaActions}>
              <Button
                variant="primary"
                size="lg"
                href={STORY_ROUTES.contact}
                icon={<LuArrowRight className={s.dirIcon} aria-hidden="true" />}
              >
                {t("cta.primary")}
              </Button>
              <Button variant="outline" size="lg" href={STORY_ROUTES.courses}>
                {t("cta.secondary")}
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
