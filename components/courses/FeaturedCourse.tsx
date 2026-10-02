"use client";

/**
 * FeaturedCourse
 * ---------------------------------------------------------------------------
 * The single stronger-weight moment in the catalog: dark primary surface,
 * large title, amber call-to-action, and an "At a glance" panel on a pattern
 * (echoing the homepage's learn-to-code card). Only fields that exist on the
 * course are listed. Shown only while no filter is active.
 */
import Link from "next/link";
import {  useLocale, useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";
import { COURSES_NAMESPACE, localize } from "./data";
import { LevelMeter } from "./LevelMeter";
import type { Course } from "./types";
import s from "./courses.module.css";
import { useFormatNumber } from "../shared/format-number";

export function FeaturedCourse({ course }: { readonly course: Course }) {
  const t = useTranslations(COURSES_NAMESPACE);
  const locale = useLocale();
  const formatNumber = useFormatNumber();


  return (
    <article className={s.featured}>
      <div className={s.featuredBody}>
        <span className={s.featuredBadge}>{t("featured.badge")}</span>
        <h3 className={s.featuredTitle}>{localize(course.title, locale)}</h3>
        <p className={s.featuredDesc}>{localize(course.description, locale)}</p>
        <Link href={`/${locale}/courses/${course.slug}`} className={`${s.btn} ${s.btnAccent}`}>
          {t("featured.cta")}
          <LuArrowRight className={s.dirIcon} aria-hidden="true" />
        </Link>
      </div>

      <div className={s.featuredMedia}>
        <span className={`${s.pattern} ${s.patternDark}`} aria-hidden="true" />
        <dl className={s.glance}>
          <p className={s.glanceTitle}>{t("featured.glance")}</p>
          <div className={s.glanceRow}>
            <dt>{t("featured.topic")}</dt>
            <dd>{t(`categories.${course.category}`)}</dd>
          </div>
          <div className={s.glanceRow}>
            <dt>{t("featured.level")}</dt>
            <dd>
              <LevelMeter level={course.level} />
            </dd>
          </div>
          {course.durationWeeks !== undefined && (
            <div className={s.glanceRow}>
              <dt>{t("featured.duration")}</dt>
              <dd>{t("card.duration", { count: formatNumber(course.durationWeeks) })}</dd>
            </div>
          )}
          <div className={s.glanceRow}>
            <dt>{t("featured.status")}</dt>
            <dd>{t(`status.${course.status}`)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
