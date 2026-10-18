/**
 * SkillCenterOverview
 * ---------------------------------------------------------------------------
 * "What it is." Editorial split: a sticky heading column and a ruled list of
 * four qualities (Divider lines instead of cards). The closing note points to
 * the team for practical details, so nothing is invented here.
 */
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Divider } from "@/components/ui/Divider";
import { Reveal } from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { OVERVIEW_POINTS, SKILL_NAMESPACE } from "./data";
import s from "./skill-center.module.css";

export function SkillCenterOverview() {
  const t = useTranslations(SKILL_NAMESPACE);

  return (
    <section className={`${s.section} ${s.overview}`}>
      <Container>
        <div className={s.overviewGrid}>
          <div className={s.overviewIntro}>
            <Reveal direction="up">
              <SectionHeading
                align="left"
                eyebrow={t("overview.eyebrow")}
                title={t("overview.title")}
                description={t("overview.description")}
              />
              <p className={s.overviewNote}>{t("overview.note")}</p>
            </Reveal>
          </div>

          <Stagger>
            <div>
              {OVERVIEW_POINTS.map((point, i) => {
                const Icon = point.icon;
                return (
                  <StaggerItem key={point.id}>
                    {i > 0 && <Divider />}
                    <div className={s.point}>
                      <span className={s.pointIcon}>
                        <Icon aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className={s.pointTitle}>{t(point.titleKey)}</h3>
                        <p className={s.pointText}>{t(point.descriptionKey)}</p>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </div>
          </Stagger>
        </div>
      </Container>
    </section>
  );
}
