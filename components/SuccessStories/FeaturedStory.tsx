"use client";

/**
 * FeaturedStory
 * ---------------------------------------------------------------------------
 * The strongest moment on the page, on a deep-green surface:
 *   [ visual (arched, revealed with a wipe) ]  [ story · name · meta · path ]
 * Every block renders only when its data exists:
 *   story text, name, course (linked when it has a slug), year, result,
 *   learning path. Without an image the visual falls back to the pattern.
 * Motion: the visual fades/scales in and the text rises (reduced motion: fade only).
 * The visual is never hidden by default, so it can't end up blank.
 */
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { StoryVisual } from "./StoryVisual";
import { useFormatNumber } from "@/components/shared/format-number";
import {
  STORIES_NAMESPACE,
  formatStoryYear,
  localize,
} from "./data";
import type { SuccessStory } from "./types";
import s from "./success-stories.module.css";

export function FeaturedStory({ story }: { readonly story: SuccessStory }) {
  const t = useTranslations(STORIES_NAMESPACE);
  const locale = useLocale();
  const formatNumber = useFormatNumber();
  const reduce = useReducedMotion();

  const name = story.studentName ? localize(story.studentName, locale) : t("featured.anonymous");
  const year = story.date ? formatStoryYear(story.date, locale) : null;
  const hasMeta = Boolean(story.course || year || story.result);

  return (
    <section className={`${s.section} ${s.featured}`} aria-label={t("featured.label")}>
      <Container>
        <div className={s.featuredGrid}>
          {/* Visual: arched portrait with offset rings and floating facts.
              Visible by default; only a light fade/scale plays on entry. */}
          <motion.div
            className={s.featuredVisualWrap}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Two offset outlines behind the frame give depth without shadows */}
            <span className={s.archRing} aria-hidden="true" />
            <span className={`${s.archRing} ${s.archRingTwo}`} aria-hidden="true" />

            <div className={s.featuredVisual}>
              <StoryVisual story={story} sizes="(min-width: 64rem) 40vw, 100vw" />
            </div>

            {/* Floating facts — only when the data exists */}
            {story.course && (
              <div className={s.visualChip}>
                <span>{t("featured.course")}</span>
                <strong>{localize(story.course.title, locale)}</strong>
              </div>
            )}
            {year && <span className={s.yearTag}>{year}</span>}
          </motion.div>

          <div className={s.featuredContent}>
            <Reveal direction="up">
              <p className={s.darkEyebrow}>{t("featured.label")}</p>
              {story.category && (
                <Badge variant="accent">{localize(story.category.label, locale)}</Badge>
              )}
            </Reveal>

            {story.story && (
              <Reveal direction="up" delay={0.08}>
                <p className={s.featuredStory}>{localize(story.story, locale)}</p>
              </Reveal>
            )}

            <Reveal direction="up" delay={0.14}>
              <p className={s.featuredName}>{name}</p>

              {hasMeta && (
                <dl className={s.featuredMeta}>
                  {story.course && (
                    <div>
                      <dt>{t("featured.course")}</dt>
                      <dd>
                        {story.course.slug ? (
                          <Link href={`/${locale}/courses/${story.course.slug}`}>
                            {localize(story.course.title, locale)}
                          </Link>
                        ) : (
                          localize(story.course.title, locale)
                        )}
                      </dd>
                    </div>
                  )}
                  {story.result && (
                    <div>
                      <dt>{t("featured.result")}</dt>
                      <dd>{localize(story.result, locale)}</dd>
                    </div>
                  )}
                  {year && (
                    <div>
                      <dt>{t("featured.date")}</dt>
                      <dd>
                        <time dateTime={story.date}>{year}</time>
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </Reveal>

            {story.learningPath && story.learningPath.length > 0 && (
              <Reveal direction="up" delay={0.2}>
                <p className={s.pathTitle}>{t("featured.pathTitle")}</p>
                <ol className={s.path}>
                  {story.learningPath.map((step, i) => (
                    <li key={i}>
                      <span className={s.pathNum}>
                        {formatNumber(i + 1, { minimumIntegerDigits: 2 })}
                      </span>
                      {localize(step, locale)}
                    </li>
                  ))}
                </ol>
              </Reveal>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}