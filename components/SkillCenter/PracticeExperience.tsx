/**
 * PracticeExperience
 * ---------------------------------------------------------------------------
 * "Why practice matters." The one dark section on the page: a large
 * statement on one side, three numbered principles on the other. It contains
 * only typography (no shared buttons/headings), because those components are
 * tuned for light surfaces.
 */
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { useFormatNumber } from "@/components/shared/format-number";
import { PRACTICE_PRINCIPLES, SKILL_NAMESPACE } from "./data";
import s from "./skill-center.module.css";

export function PracticeExperience() {
  const t = useTranslations(SKILL_NAMESPACE);
  const formatNumber = useFormatNumber();

  return (
    <section className={`${s.section} ${s.practice}`}>
      <Container>
        <div className={s.practiceGrid}>
          <Reveal direction="up">
            <p className={s.darkEyebrow}>{t("practice.eyebrow")}</p>
            <h2 className={s.practiceTitle}>{t("practice.title")}</h2>
            <p className={s.practiceText}>{t("practice.text")}</p>
          </Reveal>

          <Stagger>
            <div className={s.principles}>
              {PRACTICE_PRINCIPLES.map((p, i) => (
                <StaggerItem key={p.id}>
                  <article className={s.principle}>
                    <span className={s.principleNum}>
                      {formatNumber(i + 1, { minimumIntegerDigits: 2 })}
                    </span>
                    <div>
                      <h3 className={s.principleTitle}>{t(p.titleKey)}</h3>
                      <p className={s.principleText}>{t(p.descriptionKey)}</p>
                    </div>
                  </article>
                </StaggerItem>
              ))}
            </div>
          </Stagger>
        </div>
      </Container>
    </section>
  );
}
