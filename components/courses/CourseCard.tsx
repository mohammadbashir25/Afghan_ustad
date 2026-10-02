"use client";

/**
 * CourseCard
 * ---------------------------------------------------------------------------
 * Standard catalog card. Hierarchy: media (category + status) → title →
 * short description → quiet metadata row → link affordance.
 *
 * Accessibility: the title is the real <a>; a ::after pseudo-element
 * stretches it over the whole card, so the entire card is clickable without
 * nesting links.
 * Hover (CSS only, on the inner <article> so it never fights Framer's layout
 * transforms on the parent <li>): lift, border to primary, pattern shift,
 * arrow nudge. The arrow is mirrored for RTL via --dir.
 */
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LuArrowRight, LuClock } from "react-icons/lu";
import { COURSES_NAMESPACE, localize } from "./data";
import { LevelMeter } from "./LevelMeter";
import type { Course } from "./types";
import s from "./courses.module.css";
import { useFormatNumber } from "../shared/format-number";

export function CourseCard({ course }: { readonly course: Course }) {
  const t = useTranslations(COURSES_NAMESPACE);
  const locale = useLocale();
  const formatNumber = useFormatNumber();
  const isSoon = course.status === "comingSoon";

  return (
    <article className={s.card}>
      <div className={s.cardMedia}>
        {course.image ? (
          // Local /public images work out of the box; remote hosts need next.config images.
          <Image
            src={course.image}
            alt=""
            fill
            sizes="(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, 100vw"
            className={s.cardImage}
          />
        ) : (
          <span className={s.pattern} aria-hidden="true" />
        )}
        <span className={s.badge}>{t(`categories.${course.category}`)}</span>
        <span className={`${s.badge} ${s.badgeEnd} ${isSoon ? s.badgeSoon : s.badgeOpen}`}>
          {t(`status.${course.status}`)}
        </span>
      </div>

      <div className={s.cardBody}>
        <h3 className={s.cardTitle}>
          <Link href={`/${locale}/courses/${course.slug}`} className={s.cardLink}>
            {localize(course.title, locale)}
          </Link>
        </h3>
        <p className={s.cardDesc}>{localize(course.description, locale)}</p>

        <div className={s.cardMeta}>
          <LevelMeter level={course.level} />
          {course.durationWeeks !== undefined && (
            <span className={s.metaItem}>
              <LuClock aria-hidden="true" />
              {t("card.duration", { count: formatNumber(course.durationWeeks) })}
            </span>
          )}
        </div>

        <div className={s.cardFooter}>
          <span>{t("card.viewCourse")}</span>
          <LuArrowRight className={s.arrow} aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
