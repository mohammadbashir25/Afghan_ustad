/**
 * CourseToSkill
 * ---------------------------------------------------------------------------
 * Connection between Courses and the Skill Center, shown as four paired rows:
 * what happens in the course → what the Skill Center does with it.
 * Desktop: [course cell] → [skill cell]. Mobile: cell, down-arrow, cell.
 * The connector arrow flips in RTL on desktop and rotates downward on mobile.
 */
import { useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { COURSE_SKILL_PAIRS, SKILL_NAMESPACE, SKILL_ROUTES } from "./data";
import s from "./skill-center.module.css";

export function CourseToSkill() {
  const t = useTranslations(SKILL_NAMESPACE);

  return (
    <section className={`${s.section} ${s.pairs}`}>
      <Container>
        <Reveal direction="up">
          <SectionHeading
            align="left"
            eyebrow={t("courseToSkill.eyebrow")}
            title={t("courseToSkill.title")}
            description={t("courseToSkill.description")}
          />
        </Reveal>

        <Stagger>
          <div className={s.pairList}>
            {COURSE_SKILL_PAIRS.map((pair) => (
              <StaggerItem key={pair.id}>
                <div className={s.pair}>
                  <div className={s.pairCell}>
                    <p className={s.pairLabel}>{t("courseToSkill.courseColumn")}</p>
                    <p className={s.pairText}>{t(pair.courseKey)}</p>
                  </div>
                  <LuArrowRight className={s.pairLink} aria-hidden="true" />
                  <div className={`${s.pairCell} ${s.pairCellSkill}`}>
                    <p className={s.pairLabel}>{t("courseToSkill.skillColumn")}</p>
                    <p className={s.pairText}>{t(pair.skillKey)}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </div>
        </Stagger>

        <Reveal direction="up" delay={0.1}>
          <div className={s.pairsAction}>
            <Button variant="outline" size="md" href={SKILL_ROUTES.courses}>
              {t("courseToSkill.browse")}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
