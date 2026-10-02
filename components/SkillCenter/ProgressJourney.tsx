"use client";

/**
 * ProgressJourney
 * ---------------------------------------------------------------------------
 * The centerpiece: the whole path as a vertical timeline.
 *
 * Animation = progression:
 *  - A green "fill" line grows with scroll (useScroll → useSpring → scaleY).
 *  - Each node switches from outlined to filled when it reaches the viewer's
 *    reading line (whileInView), so the line and nodes advance together.
 *  - Reduced motion: line fully drawn, nodes already active.
 *
 * Layout:
 *  - Mobile: rail at the inline-start edge, content beside it.
 *  - ≥ 56rem: rail in the centre, stages alternate sides. Sides are defined
 *    by grid columns (not left/right), so in RTL the alternation starts on
 *    the opposite side and text stays aligned toward the rail.
 */
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { useFormatNumber } from "@/components/shared/format-number";
import {
  JOURNEY_GOAL,
  JOURNEY_STAGES,
  SKILL_NAMESPACE,
  type JourneyStage,
} from "./data";
import s from "./skill-center.module.css";

// Brand colours as literals because Framer animates concrete colour values.
const NODE_IDLE: Variants["idle"] = {
  backgroundColor: "#FFFFFF",
  borderColor: "#B8CCC4",
  color: "#64748B",
  scale: 1,
};
const nodeVariants: Variants = {
  idle: NODE_IDLE,
  active: {
    backgroundColor: "#0B6B4F",
    borderColor: "#0B6B4F",
    color: "#FFFFFF",
    scale: 1.06,
  },
};
const goalVariants: Variants = {
  idle: NODE_IDLE,
  active: {
    backgroundColor: "#F4C430",
    borderColor: "#F4C430",
    color: "#053B2E",
    scale: 1.1,
  },
};

interface StepProps {
  readonly stage: JourneyStage;
  readonly index: number;
  readonly isGoal?: boolean;
  readonly reduce: boolean;
}

/** One timeline item: node on the rail + content on alternating sides. */
function JourneyStep({ stage, index, isGoal = false, reduce }: StepProps) {
  const t = useTranslations(SKILL_NAMESPACE);
  const formatNumber = useFormatNumber();
  const Icon = stage.icon;
  const side = index % 2 === 0 ? s.jStart : s.jEnd;

  return (
    <li className={`${s.jItem} ${side}`}>
      <motion.span
        className={s.jNode}
        variants={isGoal ? goalVariants : nodeVariants}
        initial={reduce ? "active" : "idle"}
        whileInView="active"
        // Triggers when the node passes ~60% down the viewport.
        viewport={{ once: true, amount: 1, margin: "0px 0px -40% 0px" }}
        transition={{ duration: 0.4 }}
      >
        <Icon aria-hidden="true" />
      </motion.span>

      <Reveal direction="up">
        <div className={`${s.jContent} ${isGoal ? s.jGoal : ""}`}>
          {!isGoal && (
            <p className={s.jStage}>
              {t("journey.stageLabel")} {formatNumber(index + 1)}
            </p>
          )}
          <h3 className={s.jTitle}>{t(stage.titleKey)}</h3>
          <p className={s.jText}>{t(stage.descriptionKey)}</p>
        </div>
      </Reveal>
    </li>
  );
}

export function ProgressJourney() {
  const t = useTranslations(SKILL_NAMESPACE);
  const reduce = Boolean(useReducedMotion());
  const listRef = useRef<HTMLOListElement>(null);

  // 0 → 1 as the list scrolls through the viewer's reading area.
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 65%", "end 55%"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });

  return (
    <section id="journey" className={`${s.section} ${s.journey}`}>
      <Container>
        <Reveal direction="up">
          <SectionHeading
            align="center"
            eyebrow={t("journey.eyebrow")}
            title={t("journey.title")}
            description={t("journey.description")}
          />
        </Reveal>

        <ol ref={listRef} className={s.jList}>
          {/* Rail: grey track + green fill that follows scroll */}
          <span className={s.railTrack} aria-hidden="true" />
          <motion.span
            className={s.railFill}
            aria-hidden="true"
            style={{ scaleY: reduce ? 1 : fill, originY: 0 }}
          />

          {JOURNEY_STAGES.map((stage, i) => (
            <JourneyStep key={stage.id} stage={stage} index={i} reduce={reduce} />
          ))}
          <JourneyStep
            stage={JOURNEY_GOAL}
            index={JOURNEY_STAGES.length}
            isGoal
            reduce={reduce}
          />
        </ol>
      </Container>
    </section>
  );
}
