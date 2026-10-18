"use client";

/**
 * StoryCard
 * ---------------------------------------------------------------------------
 * Reusable card for the collection. EVERY field is optional:
 *   image · category · story text · result · name · course · year
 * Layout adapts: with a photo it gets a media area; without one it gets a
 * calm amber rule on the inline-start edge instead (no empty grey box).
 * Hover: border + gentle lift on the <article> (CSS only).
 */
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { StoryVisual } from "./StoryVisual";
import {
  STORIES_NAMESPACE,
  formatStoryYear,
  localize,
} from "./data";
import type { SuccessStory } from "./types";
import s from "./success-stories.module.css";

export function StoryCard({ story }: { readonly story: SuccessStory }) {
  const t = useTranslations(STORIES_NAMESPACE);
  const locale = useLocale();

  const name = story.studentName ? localize(story.studentName, locale) : t("featured.anonymous");
  const year = story.date ? formatStoryYear(story.date, locale) : null;

  return (
    <article className={`${s.card} ${story.image ? "" : s.cardPlain}`}>
      {story.image && (
        <div className={s.cardMedia}>
          <StoryVisual story={story} sizes="(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, 100vw" />
        </div>
      )}

      <div className={s.cardBody}>
        {story.category && <Badge variant="muted">{localize(story.category.label, locale)}</Badge>}

        {story.story && <p className={s.cardStory}>{localize(story.story, locale)}</p>}

        {story.result && (
          <p className={s.cardResult}>
            <span>{t("featured.result")}</span>
            {localize(story.result, locale)}
          </p>
        )}

        <footer className={s.cardFooter}>
          <span className={s.cardName}>{name}</span>
          <span className={s.cardMeta}>
            {story.course &&
              (story.course.slug ? (
                <Link href={`/${locale}/courses/${story.course.slug}`} className={s.cardCourse}>
                  {localize(story.course.title, locale)}
                </Link>
              ) : (
                <span>{localize(story.course.title, locale)}</span>
              ))}
            {year && <time dateTime={story.date}>{year}</time>}
          </span>
        </footer>
      </div>
    </article>
  );
}
