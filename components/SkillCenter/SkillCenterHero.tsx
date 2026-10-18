/**
 * SkillCenterHero
 * ---------------------------------------------------------------------------
 * Left: promise + actions. Right: a "path ribbon" — the six stages as a
 * stepped staircase (each row indented a little more than the last), so the
 * hero already shows that a skill is built in steps. The indent uses a
 * logical margin, so the staircase descends from the correct side in RTL.
 */
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { LuArrowRight } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { useFormatNumber } from "@/components/shared/format-number";
import { JOURNEY_STAGES, SKILL_NAMESPACE, SKILL_ROUTES } from "./data";
import s from "./skill-center.module.css";

export function SkillCenterHero() {
  const t = useTranslations(SKILL_NAMESPACE);
  const formatNumber = useFormatNumber();

  return (
    <section className={`${s.section} ${s.hero}`}>
      <Container>
        <div className={s.heroGrid}>
          <div>
            <Reveal direction="up">
              <Badge variant="accent">{t("hero.badge")}</Badge>
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h1 className={s.heroTitle}>{t("hero.title")}</h1>
            </Reveal>
            <Reveal direction="up" delay={0.16}>
              <p className={s.heroLead}>{t("hero.lead")}</p>
            </Reveal>
            <Reveal direction="up" delay={0.24}>
              <div className={s.heroActions}>
                <Button
                  variant="primary"
                  size="lg"
                  href={SKILL_ROUTES.courses}
                  icon={<LuArrowRight className={s.dirIcon} aria-hidden="true" />}
                >
                  {t("hero.primary")}
                </Button>
                <Button variant="outline" size="lg" href={SKILL_ROUTES.journey}>
                  {t("hero.secondary")}
                </Button>
              </div>
            </Reveal>
          </div>

          {/* Stepped ribbon of the six stages */}
          <div className={s.ribbon}>
            <p className={s.ribbonTitle}>{t("hero.ribbonTitle")}</p>
            <Stagger>
              <div className={s.ribbonList}>
                {JOURNEY_STAGES.map((stage, i) => {
                  const Icon = stage.icon;
                  const last = i === JOURNEY_STAGES.length - 1;
                  return (
                    <StaggerItem key={stage.id}>
                      <div
                        className={`${s.ribbonRow} ${last ? s.ribbonRowLast : ""}`}
                        style={{ "--i": i } as CSSProperties}
                      >
                        <span className={s.ribbonNum}>
                          {formatNumber(i + 1, { minimumIntegerDigits: 2 })}
                        </span>
                        <Icon className={s.ribbonIcon} aria-hidden="true" />
                        <span className={s.ribbonName}>{t(stage.titleKey)}</span>
                      </div>
                    </StaggerItem>
                  );
                })}
              </div>
            </Stagger>
          </div>
        </div>
      </Container>
    </section>
  );
}
