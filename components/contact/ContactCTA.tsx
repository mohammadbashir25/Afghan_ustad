"use client";

/**
 * ContactCTA
 * ---------------------------------------------------------------------------
 * Last block of the landing site: send the visitor toward learning. Light
 * panel (keeps shared Button contrast) with the amber edge used on other pages.
 */
import { useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { CONTACT_NAMESPACE, CONTACT_ROUTES } from "./data";
import s from "./contact.module.css";

export function ContactCTA() {
  const t = useTranslations(CONTACT_NAMESPACE);

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
                href={CONTACT_ROUTES.courses}
                icon={<LuArrowRight className={s.dirIcon} aria-hidden="true" />}
              >
                {t("cta.primary")}
              </Button>
              <Button variant="outline" size="lg" href={CONTACT_ROUTES.skillCenter}>
                {t("cta.secondary")}
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
