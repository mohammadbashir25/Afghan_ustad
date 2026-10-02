/**
 * SkillCenterCTA
 * ---------------------------------------------------------------------------
 * Closing panel on a light surface (so the shared Button variants keep their
 * contrast) with an amber edge as the single accent.
 */
import { useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SKILL_NAMESPACE, SKILL_ROUTES } from "./data";
import s from "./skill-center.module.css";

export function SkillCenterCTA() {
  const t = useTranslations(SKILL_NAMESPACE);

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
                href={SKILL_ROUTES.courses}
                icon={<LuArrowRight className={s.dirIcon} aria-hidden="true" />}
              >
                {t("cta.primary")}
              </Button>
              <Button variant="outline" size="lg" href={SKILL_ROUTES.contact}>
                {t("cta.secondary")}
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
