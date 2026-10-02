/**
 * CourseDetail
 * ---------------------------------------------------------------------------
 * Server component (no state, no motion needed). Layout:
 *   back link
 *   [ title + description ]   [ facts panel + enroll action ]
 *   related courses
 * Only fields that exist on the course are shown. When you add richer CMS
 * fields (syllabus, outcomes, requirements) render them as new sections
 * between the header and the related list.
 */
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import { Container } from "@/components/ui/Container"; // existing layout primitive
import { CourseGrid } from "@/components/courses/CourseGrid";
import { COURSES_NAMESPACE, CTA_LINKS, localize } from "./data";
import { LevelMeter } from "@/components/courses/LevelMeter";
import type { Course } from "@/components/courses/types";
import s from "./courses.module.css";
import { useFormatNumber } from "@/components/shared/format-number";

interface CourseDetailProps {
  readonly course: Course;
  readonly related: readonly Course[];
}

export function CourseDetail({ course, related }: CourseDetailProps) {
  const t = useTranslations(COURSES_NAMESPACE);
  const locale = useLocale();
  const formatNumber = useFormatNumber();
  const isSoon = course.status === "comingSoon";

  return (
    <>
      <section className={`${s.section} ${s.detailHero}`}>
        <Container>
          <Link href={`/${locale}/courses`} className={s.backLink}>
            {/* dirIcon mirrors the arrow in RTL */}
            <LuArrowLeft className={s.dirIcon} aria-hidden="true" />
            {t("detail.back")}
          </Link>

          <div className={s.detailGrid}>
            <div>
              <div className={s.detailTags}>
                <span className={s.detailTag}>{t(`categories.${course.category}`)}</span>
                <span className={`${s.detailTag} ${isSoon ? s.detailTagSoon : ""}`}>
                  {t(`status.${course.status}`)}
                </span>
              </div>
              <h1 className={s.detailTitle}>{localize(course.title, locale)}</h1>
              <p className={s.detailLead}>{localize(course.description, locale)}</p>
            </div>

            <aside className={s.facts} aria-labelledby="facts-heading">
              <h2 id="facts-heading" className={s.factsTitle}>
                {t("detail.factsTitle")}
              </h2>
              <dl className={s.factsList}>
                <div className={s.factRow}>
                  <dt>{t("detail.topic")}</dt>
                  <dd>{t(`categories.${course.category}`)}</dd>
                </div>
                <div className={s.factRow}>
                  <dt>{t("detail.level")}</dt>
                  <dd>
                    <LevelMeter level={course.level} />
                  </dd>
                </div>
                {course.durationWeeks !== undefined && (
                  <div className={s.factRow}>
                    <dt>{t("detail.duration")}</dt>
                    <dd>{t("card.duration", { count: formatNumber(course.durationWeeks) })}</dd>
                  </div>
                )}
              </dl>

              {isSoon ? (
                <>
                  <p className={s.factsNote}>{t("detail.soonNote")}</p>
                  <Link href={`/${locale}${CTA_LINKS.contact}`} className={`${s.btn} ${s.btnOutline}`}>
                    {t("detail.askQuestion")}
                  </Link>
                </>
              ) : (
                <Link
                  href={`/${locale}${CTA_LINKS.enroll}?course=${course.slug}`}
                  className={`${s.btn} ${s.btnPrimary}`}
                >
                  {t("detail.enroll")}
                  <LuArrowRight className={s.dirIcon} aria-hidden="true" />
                </Link>
              )}
            </aside>
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <section className={`${s.section} ${s.discovery}`} aria-labelledby="related-heading">
          <Container>
            <h2 id="related-heading" className={s.relatedTitle}>
              {t("detail.relatedTitle")}
            </h2>
            <CourseGrid courses={related} />
          </Container>
        </section>
      )}
    </>
  );
}
