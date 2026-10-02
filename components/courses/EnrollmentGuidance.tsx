"use client";

/**
 * EnrollmentGuidance
 * ---------------------------------------------------------------------------
 * Helps an unsure visitor decide. Deliberately NOT a card grid:
 *   left  → what each level means (reuses LevelMeter)
 *   right → a numbered 3-step path joined by a vertical rule
 * Step numbers are localised with next-intl's number formatter.
 */
import { motion } from "framer-motion";
import {  useTranslations } from "next-intl";
import { COURSES_NAMESPACE, GUIDANCE_STEP_IDS, LEVEL_ORDER } from "./data";
import { LevelMeter } from "./LevelMeter";
import { useMotionPresets } from "./motion";
import { Container } from "@/components/ui/Container"; // existing layout primitive
import s from "./courses.module.css";
import { useFormatNumber } from "@/components/shared/format-number";

export function EnrollmentGuidance() {
  const t = useTranslations(COURSES_NAMESPACE);
  const formatNumber = useFormatNumber();
  const { stagger, rise } = useMotionPresets();

  return (
    <section className={`${s.section} ${s.guidance}`} aria-labelledby="guidance-heading">
      <Container>
        <motion.div
          className={s.guidanceGrid}
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={rise}>
            <h2 id="guidance-heading" className={s.guidanceTitle}>
              {t("guidance.title")}
            </h2>
            <p className={s.guidanceLead}>{t("guidance.lead")}</p>

            <h3 className={s.subhead}>{t("guidance.levelsTitle")}</h3>
            <ul className={s.levelList}>
              {LEVEL_ORDER.map((level) => (
                <li key={level} className={s.levelRow}>
                  <LevelMeter level={level} />
                  <p>{t(`guidance.levelDescriptions.${level}`)}</p>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={rise}>
            <h3 className={s.subhead}>{t("guidance.stepsTitle")}</h3>
            <ol className={s.steps}>
              {GUIDANCE_STEP_IDS.map((id, i) => (
                <li key={id} className={s.step}>
                  <span className={s.stepNum} aria-hidden="true">
                    {formatNumber(i + 1)}
                  </span>
                  <div>
                    <h4 className={s.stepTitle}>{t(`guidance.steps.${id}.title`)}</h4>
                    <p className={s.stepText}>{t(`guidance.steps.${id}.description`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
