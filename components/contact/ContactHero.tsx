"use client";

/**
 * ContactHero
 * ---------------------------------------------------------------------------
 * Friendly opener. Right side: a "signal" illustration — concentric rings
 * radiating from an amber core, with phone / mail / learning chips sitting on
 * them. It suggests communication without inventing a map, people or numbers.
 * Chips use logical insets so the composition mirrors in RTL; their slow float
 * is disabled for reduced motion.
 */
import { useTranslations } from "next-intl";
import { LuGraduationCap, LuMail, LuPhone } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { CONTACT_NAMESPACE } from "./data";
import s from "./contact.module.css";

export function ContactHero() {
  const t = useTranslations(CONTACT_NAMESPACE);

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

          {/* Decorative signal illustration (aria-hidden) */}
          <Reveal direction="up" delay={0.2}>
            <div className={s.signal} aria-hidden="true">
              <span className={`${s.ring} ${s.ring4}`} />
              <span className={`${s.ring} ${s.ring3}`} />
              <span className={`${s.ring} ${s.ring2}`} />
              <span className={`${s.ring} ${s.ring1}`} />
              <span className={s.core} />
              <span className={`${s.chip} ${s.chipPhone}`}>
                <LuPhone />
              </span>
              <span className={`${s.chip} ${s.chipMail}`}>
                <LuMail />
              </span>
              <span className={`${s.chip} ${s.chipLearn}`}>
                <LuGraduationCap />
              </span>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
