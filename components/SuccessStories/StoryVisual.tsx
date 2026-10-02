"use client";

/**
 * StoryVisual
 * ---------------------------------------------------------------------------
 * The picture area of a story. With a real image it renders it (fill, cover).
 * Without one it draws a deliberate fallback — the AfghanUstad lattice pattern
 * plus the learner's initial (derived from the real name) or a neutral icon —
 * so a missing photo never looks broken. The PARENT supplies size/aspect.
 */
import Image from "next/image";
import { useLocale } from "next-intl";
import { LuUsers } from "react-icons/lu";
import { localize } from "./data";
import type { SuccessStory } from "./types";
import s from "./success-stories.module.css";

interface StoryVisualProps {
  readonly story: SuccessStory;
  readonly sizes: string;
}

export function StoryVisual({ story, sizes }: StoryVisualProps) {
  const locale = useLocale();
  const name = story.studentName ? localize(story.studentName, locale) : "";

  if (story.image) {
    const alt = story.image.alt ? localize(story.image.alt, locale) : name;
    return <Image src={story.image.src} alt={alt} fill sizes={sizes} className={s.visualImage} />;
  }

  const initial = name.trim().charAt(0);
  return (
    <div className={s.visualFallback} aria-hidden="true">
      <span className={s.pattern} />
      {initial ? <span className={s.initial}>{initial}</span> : <LuUsers className={s.fallbackIcon} />}
    </div>
  );
}
