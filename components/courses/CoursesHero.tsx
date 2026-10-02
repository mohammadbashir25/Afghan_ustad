"use client";

/**
 * CoursesHero
 * ---------------------------------------------------------------------------
 * Calm, editorial page opener that continues the homepage language
 * (eyebrow with rule, large dark-green headline, mint panel).
 * The three figures are DERIVED from the catalog (counts of courses, topics
 * and levels) — never hand-typed — so they stay true when data changes.
 */

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { COURSES_NAMESPACE } from "./data";
import { useMotionPresets } from "./motion";
import { Container } from "@/components/ui/Container"; // existing layout primitive
import s from "./courses.module.css";
import { useFormatNumber } from "../shared/format-number";

interface CoursesHeroProps {
  readonly courseCount: number;
  readonly categoryCount: number;
  readonly levelCount: number;
}

export function CoursesHero({ courseCount, categoryCount, levelCount }: CoursesHeroProps) {
  const t = useTranslations(COURSES_NAMESPACE);
  const locale = useLocale();
  const formatNumber = useFormatNumber();
  const { stagger, rise } = useMotionPresets();

  const stats = [
    { value: courseCount, label: t("hero.stats.courses") },
    { value: categoryCount, label: t("hero.stats.categories") },
    { value: levelCount, label: t("hero.stats.levels") },
  ];

  return (
    <section className={`${s.section} ${s.hero}`}>
      <Container>
        <motion.div className={s.heroGrid} variants={stagger} initial="hidden" animate="visible">
          <div>
            {/* Breadcrumb: Home / Courses */}

            <motion.p variants={rise} className={s.eyebrow} >
              {t("hero.eyebrow")}
            </motion.p>
            <motion.h1 variants={rise} className={s.heroTitle}>
              {t("hero.title")}
            </motion.h1>
            <motion.p variants={rise} className={s.heroLead}>
              {t("hero.lead")}
            </motion.p>
          </div>

          <motion.dl variants={rise} className={s.stats}>
            {stats.map((stat) => (
              <div key={stat.label} className={s.stat}>
                <dt className={s.statLabel}>{stat.label}</dt>
                <dd className={s.statValue}>{formatNumber(stat.value)}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </Container>
    </section>
  );
}
