"use client";

/**
 * ValueProposition
 * ---------------------------------------------------------------------------
 * Answers: "Why does the AfghanUstad learning approach matter?"
 *
 * The Hero already names the four stages. This section shows what they mean
 * in practice by following ONE example lesson through Learn → Practice →
 * Apply → Progress, as a stepped "staircase" of cards.
 *
 *   ┌────────────────────┬──────────────────────────────┐
 *   │ heading            │ Example lesson: …             │
 *   │ intro              │ ┌ Learn ─────────────┐        │
 *   │ honesty note       │   ┌ Practice ────────┐        │
 *   │ (sticky ≥ lg)      │     ┌ Apply ─────────┐        │
 *   │                    │       ┌ Progress ────┐        │
 *   └────────────────────┴──────────────────────────────┘
 * Mobile: single column, no indentation.
 *
 * A deep forest-green surface follows the light Hero for contrast while
 * keeping the same palette. All copy comes from next-intl via data.ts keys.
 */
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Container } from "@/components/ui/Container"; // existing layout primitive
import { ValuePillarCard } from "./ValuePillarCard";
import { VALUE_NAMESPACE, VALUE_PILLARS, VALUE_SECTION_KEYS } from "./data";
import styles from "./ValueProposition.module.css";

export function ValueProposition() {
  const t = useTranslations(VALUE_NAMESPACE);
  const reduceMotion = useReducedMotion();

  // Defensive sort so editing data.ts can't break the loop order.
  const pillars = [...VALUE_PILLARS].sort((a, b) => a.order - b.order);

  // One orchestrated reveal: narrative fades in, then cards step in.
  const introVariants: Variants = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const listVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
  };

  return (
    <section
      aria-labelledby="value-proposition-heading"
      className={styles.section}
    >
      <Container>
        <div className={styles.layout}>
          {/* Left: narrative */}
          <motion.div
            className={styles.intro}
            variants={introVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 id="value-proposition-heading" className={styles.heading}>
              {t(VALUE_SECTION_KEYS.heading)}
            </h2>
            <p className={styles.lead}>{t(VALUE_SECTION_KEYS.intro)}</p>
            <p className={styles.note}>{t(VALUE_SECTION_KEYS.note)}</p>
          </motion.div>

          {/* Right: one lesson, four stages */}
          <div>
            <div className={styles.exampleBar}>
              <span className={styles.exampleLabel}>
                {t(VALUE_SECTION_KEYS.exampleLabel)}
              </span>
              <span className={styles.exampleTitle}>
                {t(VALUE_SECTION_KEYS.exampleTitle)}
              </span>
            </div>

            <motion.ol
              className={styles.list}
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
            >
              {pillars.map((pillar) => (
                <ValuePillarCard key={pillar.id} pillar={pillar} />
              ))}
            </motion.ol>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default ValueProposition;