"use client";

/**
 * CTAContent — the text side of the final CTA: eyebrow, headline, description,
 * actions and a short supporting note.
 *
 * Role & choices
 *  - Answers "what should I do next?" with one clear primary action
 *    (enroll → contact page) and one quieter secondary action (browse courses).
 *  - The primary action is a light Button (variant "secondary") because the
 *    default green Button would disappear on the green surface; it hovers to
 *    accent-light, which is the section's only yellow interaction on a button.
 *    It is wrapped in MagneticButton: a single, very subtle special-CTA effect.
 *  - The secondary action is a text link with a gold underline. A second solid
 *    button would compete with the primary one.
 *  - Content enters with staggered Reveals (opacity + small translate). Reveal
 *    already respects prefers-reduced-motion.
 *  - RTL: logical properties only; the arrow icons are mirrored; the headline
 *    steps down one size and gets a taller line-height for Arabic script.
 *  - No urgency copy (no deadlines or seat counts) — see data.ts.
 */

import { useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";

import { Button, Eyebrow, MagneticButton, Reveal } from "@/components/ui";
import { Link } from "@/i18n/navigation";

import { CTA_ACTIONS, FINAL_CTA_HEADING_ID } from "./data";

export function CTAContent() {
  const t = useTranslations("landing.FinalCTA");
  const tc = useTranslations("Common");

  return (
    <div className="flex flex-col items-start gap-7">
      <Reveal>
        <Eyebrow tone="onDark">{t("eyebrow")}</Eyebrow>
      </Reveal>

      <Reveal delay={0.08}>
        <h2
          id={FINAL_CTA_HEADING_ID}
          className={[
            "max-w-2xl text-balance font-semibold text-white",
            "text-3xl leading-[1.12] ltr:tracking-tight sm:text-4xl lg:text-5xl xl:text-[3.5rem]",
            "rtl:leading-[1.45] rtl:lg:text-4xl rtl:xl:text-5xl",
          ].join(" ")}
        >
          {t("title")}
        </h2>
      </Reveal>

      <Reveal delay={0.16}>
        <p className="max-w-xl text-pretty text-lg leading-relaxed text-primary-light sm:text-xl rtl:leading-loose">
          {t("description")}
        </p>
      </Reveal>

      <Reveal delay={0.24} className="w-full sm:w-auto">
        {/* Stacked on mobile (full-width buttons), inline from `sm`. */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-6">
          {CTA_ACTIONS.map((action) =>
            action.emphasis === "primary" ? (
              <MagneticButton key={action.id} className="w-full sm:w-auto">
                <Button
                  href={action.href}
                  variant="secondary"
                  size="lg"
                  fullWidthOnMobile
                  icon={<LuArrowRight />}
                  iconPosition="end"
                  flipIconOnRtl
                >
                  {tc(action.labelKey)}
                </Button>
              </MagneticButton>
            ) : (
              <Link
                key={action.id}
                href={action.href}
                className={[
                  "group inline-flex items-center justify-center gap-2 rounded-md px-2 py-3 text-base font-medium text-white",
                  "underline decoration-accent decoration-1 underline-offset-[10px] transition-[text-decoration-thickness,transform] duration-300",
                  "hover:decoration-2 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
                  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
                ].join(" ")}
              >
                {tc(action.labelKey)}
                <LuArrowRight
                  aria-hidden
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 motion-reduce:group-hover:translate-x-0"
                />
              </Link>
            ),
          )}
        </div>
      </Reveal>

      <Reveal delay={0.32}>
        <p className="max-w-md text-sm leading-relaxed text-primary-light/80 rtl:leading-loose">{t("note")}</p>
      </Reveal>
    </div>
  );
}
