"use client";

/**
 * SkillCenterBand
 * ---------------------------------------------------------------------------
 * Responsibility: connect the philosophy to the Skill Center - the place
 * where lessons turn into practice.
 *
 *   left  : eyebrow, heading, description, three short points, CTA
 *   right : an illustrative "practice session" card. It is decorative and
 *           labelled as an illustration; it shows an example flow, not data.
 *
 * Motion: the card's rows reveal in order and their checks pop in one by one,
 * which tells the "review -> try -> check -> next" story without words.
 * Reduced motion shows the final state immediately.
 *
 * Layout: a dark rounded panel sitting inside the light section, so it reads
 * as the destination of the loop above it.
 */
import { Link } from "@/i18n/navigation"; // next-intl localized Link (createNavigation)
import { motion } from "framer-motion";
import { LuArrowRight, LuCheck } from "react-icons/lu";
import { useTranslations } from "next-intl";

import SectionIntro from "./SectionIntro";
import { useReveal } from "../shared/shared";
import { PRACTICE_ROWS, SKILL_CENTER_HREF, SKILL_POINTS } from "./data";

export default function SkillCenterBand(): React.JSX.Element {
  const t = useTranslations("pages.about.skillCenter");
  const { container, item, fromStart, fromEnd, reduced } = useReveal();

  return (
    <div className="relative mt-24 overflow-hidden rounded-[2rem] bg-primary-dark p-7 text-surface sm:p-12 lg:p-16">
      {/* Soft green glow behind the card side. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_26rem_at_90%_60%,rgba(11,107,79,0.55),transparent_65%)]"
      />

      <div className="relative grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
        {/* ------------------------------- Text ------------------------------ */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          className="lg:col-span-7"
        >
          <motion.div variants={fromStart}>
            <SectionIntro
              tone="dark"
              eyebrow={t("eyebrow")}
              title={t("title")}
              description={t("description")}
            />
          </motion.div>

          <motion.ul variants={item} className="mt-8 space-y-3 text-start">
            {SKILL_POINTS.map((id) => (
              <li key={id} className="flex items-start gap-3 text-base leading-[1.9] text-primary-light">
                <span
                  aria-hidden="true"
                  className="mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-primary-dark"
                >
                  <LuCheck className="size-3" strokeWidth={3} />
                </span>
                {t(`points.${id}`)}
              </li>
            ))}
          </motion.ul>

          <motion.div variants={item} className="mt-9">
            <Link
              href={SKILL_CENTER_HREF}
              className="group inline-flex items-center gap-3 rounded-xl border border-surface/40 px-6 py-3.5 text-base font-bold text-surface transition-[background-color,color,transform] duration-200 hover:bg-surface hover:text-primary-dark active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {t("cta")}
              <LuArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
              />
            </Link>
          </motion.div>
        </motion.div>

        {/* ---------------------------- Practice card ------------------------- */}
        <motion.div
          variants={fromEnd}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          className="lg:col-span-5"
        >
          <figure className="mx-auto max-w-md" aria-label={t("card.caption")}>
            <motion.div
              variants={container}
              className="rounded-3xl bg-surface p-6 text-start text-foreground shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]"
            >
              <p className="text-base font-bold text-primary-dark">{t("card.title")}</p>
              <ul className="mt-5 space-y-3">
                {PRACTICE_ROWS.map((row, index) => (
                  <motion.li
                    key={row.id}
                    variants={item}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
                      row.state === "active"
                        ? "border-accent bg-accent-light text-primary-dark"
                        : row.state === "done"
                          ? "border-border bg-primary-light text-primary-dark"
                          : "border-dashed border-border-strong text-text-secondary"
                    }`}
                  >
                    <motion.span
                      aria-hidden="true"
                      initial={{ scale: reduced ? 1 : 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 18,
                        delay: reduced ? 0 : 0.5 + index * 0.2,
                      }}
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        row.state === "done"
                          ? "bg-primary text-surface"
                          : row.state === "active"
                            ? "bg-accent text-primary-dark"
                            : "border border-border-strong text-text-muted"
                      }`}
                    >
                      {row.state === "done" ? <LuCheck className="size-3.5" strokeWidth={3} /> : index + 1}
                    </motion.span>
                    {t(`card.rows.${row.id}`)}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <figcaption className="mt-3 text-center text-xs text-primary-light/60">
              {t("card.caption")}
            </figcaption>
          </figure>
        </motion.div>
      </div>
    </div>
  );
}
