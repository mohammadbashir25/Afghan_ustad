"use client";

/**
 * CoursesCTA
 * ---------------------------------------------------------------------------
 * Closing band on the dark primary surface: one primary action (enroll) and
 * one quiet secondary (contact). Routes come from CTA_LINKS in data.ts.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";
import { COURSES_NAMESPACE, CTA_LINKS } from "./data";
import { useMotionPresets } from "./motion";
import { Container } from "@/components/ui/Container"; // existing layout primitive
import s from "./courses.module.css";

export function CoursesCTA() {
  const t = useTranslations(COURSES_NAMESPACE);
  const locale = useLocale();
  const { rise } = useMotionPresets();

  return (
    <section className={`${s.section} ${s.cta}`}>
      <Container>
        <motion.div
          className={s.ctaInner}
          variants={rise}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <div>
            <h2 className={s.ctaTitle}>{t("cta.title")}</h2>
            <p className={s.ctaText}>{t("cta.text")}</p>
          </div>
          <div className={s.ctaActions}>
            <Link href={`/${locale}${CTA_LINKS.enroll}`} className={`${s.btn} ${s.btnAccent}`}>
              {t("cta.primary")}
              <LuArrowRight className={s.dirIcon} aria-hidden="true" />
            </Link>
            <Link href={`/${locale}${CTA_LINKS.contact}`} className={`${s.btn} ${s.btnGhostLight}`}>
              {t("cta.secondary")}
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
