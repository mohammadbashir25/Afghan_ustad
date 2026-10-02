"use client";

/**
 * StoriesGrid
 * ---------------------------------------------------------------------------
 * The collection. Topic filter chips are DERIVED from the stories' real
 * categories and only appear when there are at least two, so a small set of
 * stories never gets a pointless filter bar. Filtering animates with Framer
 * `layout` + AnimatePresence; reduced motion keeps opacity only.
 * (No carousel: a grid lets each story be read without hidden slides.)
 */
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { StoryCard } from "./StoryCard";
import { STORIES_NAMESPACE, localize } from "./data";
import type { StoryCategory, SuccessStory } from "./types";
import s from "./success-stories.module.css";

export function StoriesGrid({ stories }: { readonly stories: readonly SuccessStory[] }) {
  const t = useTranslations(STORIES_NAMESPACE);
  const locale = useLocale();
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string>("all");

  // Unique categories actually present in the data.
  const categories = useMemo(() => {
    const map = new Map<string, StoryCategory>();
    stories.forEach((st) => st.category && map.set(st.category.id, st.category));
    return [...map.values()];
  }, [stories]);

  const visible = active === "all" ? stories : stories.filter((st) => st.category?.id === active);

  return (
    <section className={`${s.section} ${s.collection}`}>
      <Container>
        <Reveal direction="up">
          <SectionHeading
            align="left"
            eyebrow={t("grid.eyebrow")}
            title={t("grid.title")}
            description={t("grid.description")}
          />
        </Reveal>

        {categories.length >= 2 && (
          <div className={s.chips} role="group" aria-label={t("grid.filterLabel")}>
            <button
              type="button"
              aria-pressed={active === "all"}
              className={active === "all" ? s.chipOn : s.chip}
              onClick={() => setActive("all")}
            >
              {t("grid.all")}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={active === c.id}
                className={active === c.id ? s.chipOn : s.chip}
                onClick={() => setActive(c.id)}
              >
                {localize(c.label, locale)}
              </button>
            ))}
          </div>
        )}

        <ul className={s.grid}>
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((story, i) => (
              <motion.li
                key={story.id}
                layout={!reduce}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 5) * 0.05 }}
              >
                <StoryCard story={story} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Container>
    </section>
  );
}
