"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";

import {
  VALUE_NAMESPACE,
  VALUE_SECTION_KEYS,
  type ValuePillar,
} from "./data";

import styles from "./ValueProposition.module.css";

interface ValuePillarCardProps {
  readonly pillar: ValuePillar;
}

export function ValuePillarCard({
  pillar,
}: ValuePillarCardProps) {
  const t = useTranslations(VALUE_NAMESPACE);
  const reduceMotion = useReducedMotion();

  const Icon = pillar.icon;
  const isAccent = pillar.tone === "accent";

  const variants: Variants = {
    hidden: reduceMotion
      ? { opacity: 1 }
      : { opacity: 0, y: 24 },

    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const indentStyle = {
    "--step": pillar.order - 1,
  } as CSSProperties;

  return (
    <motion.li
      variants={variants}
      whileHover={
        reduceMotion ? undefined : { y: -4 }
      }
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 24,
      }}
    >
      <div
        className={styles.indent}
        style={indentStyle}
      >
        <article
          className={`${styles.card} ${
            isAccent ? styles.cardAccent : ""
          }`}
        >
          <span className={styles.icon}>
            <Icon
              aria-hidden="true"
              className={styles.glyph}
            />
          </span>

          <div>
            <div className={styles.meta}>
              <span className={styles.stage}>
                {t(pillar.labelKey)}
              </span>

              <span
                className={styles.number}
                aria-hidden="true"
              >
                {String(pillar.order).padStart(2, "0")}
              </span>
            </div>

            <h3 className={styles.title}>
              {t(pillar.titleKey)}
            </h3>

            <p className={styles.description}>
              {t(pillar.descriptionKey)}
            </p>

            <p className={styles.example}>
              <span className={styles.exampleLead}>
                {t(VALUE_SECTION_KEYS.exampleLead)}
              </span>

              {t(pillar.exampleKey)}
            </p>
          </div>
        </article>
      </div>
    </motion.li>
  );
}

