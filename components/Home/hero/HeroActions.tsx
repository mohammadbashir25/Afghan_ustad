"use client";

/**
 * HeroActions — the hero's CTA path.
 *
 * Role
 *  - Renders the actions declared in data.ts: one primary CTA (courses) and one
 *    quieter outline CTA (about). Labels come from the shared "Common" namespace.
 *  - Full-width and stacked on mobile (thumb-friendly), inline from `sm` up.
 *
 * Implementation choices
 *  - Only the primary CTA is wrapped in MagneticButton. Applying the effect to
 *    both would dilute it; it stays a single deliberate micro-interaction.
 *  - The whole row enters with one opacity/translate animation (no per-button
 *    bounce). With reduced motion it becomes a plain fade.
 */

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";

import { Button, MagneticButton } from "@/components/ui";
import { EASE_OUT } from "@/components/ui/utils";

import { HERO_ACTIONS, HERO_TIMING } from "./data";

export function HeroActions({ delay = HERO_TIMING.actions }: { delay?: number }) {
  const t = useTranslations("Common");
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.3 : 0.7, delay, ease: EASE_OUT }}
    >
      {HERO_ACTIONS.map((action) => {
        const button = (
          <Button
            href={action.href}
            variant={action.variant}
            size="lg"
            fullWidthOnMobile
            icon={action.withArrow ? <LuArrowRight /> : undefined}
            iconPosition="end"
            flipIconOnRtl
          >
            {t(action.labelKey)}
          </Button>
        );

        return action.magnetic ? (
          <MagneticButton key={action.id} className="w-full sm:w-auto">
            {button}
          </MagneticButton>
        ) : (
          <div key={action.id} className="w-full sm:w-auto">
            {button}
          </div>
        );
      })}
    </motion.div>
  );
}
