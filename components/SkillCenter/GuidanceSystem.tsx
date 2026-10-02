"use client";

/**
 * GuidanceSystem
 * ---------------------------------------------------------------------------
 * Interactive explorer for how practice is supported:
 * guided practice → assignments → feedback.
 *
 * - Accessible tabs (roving tabindex, arrow keys, Home/End). The "forward"
 *   horizontal arrow is swapped in RTL so keys match what you see.
 * - Panel content cross-fades with AnimatePresence(mode="wait").
 * - Reduced motion: movement removed, only opacity remains.
 */
import { useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { LuArrowRight, LuCheck } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { useFormatNumber } from "@/components/shared/format-number";
import {
  GUIDANCE_TABS,
  SKILL_NAMESPACE,
  type GuidanceTabId,
} from "./data";
import s from "./skill-center.module.css";

export function GuidanceSystem() {
  const t = useTranslations(SKILL_NAMESPACE);
  const locale = useLocale();
  const formatNumber = useFormatNumber();
  const reduce = useReducedMotion();

  const [active, setActive] = useState<GuidanceTabId>(GUIDANCE_TABS[0].id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const isRtl = locale === "fa" || locale === "ps";
  const forwardKey = isRtl ? "ArrowLeft" : "ArrowRight";
  const backKey = isRtl ? "ArrowRight" : "ArrowLeft";
  const tab = GUIDANCE_TABS.find((x) => x.id === active) ?? GUIDANCE_TABS[0];

  /** Select a tab by index (wrapping) and move focus with it. */
  const goTo = (index: number) => {
    const count = GUIDANCE_TABS.length;
    const next = GUIDANCE_TABS[(index + count) % count];
    setActive(next.id);
    tabRefs.current[next.id]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === "ArrowDown" || e.key === forwardKey) {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === "ArrowUp" || e.key === backKey) {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(GUIDANCE_TABS.length - 1);
    }
  };

  return (
    <section className={`${s.section} ${s.guidance}`}>
      <Container>
        <Reveal direction="up">
          <SectionHeading
            align="left"
            eyebrow={t("guidance.eyebrow")}
            title={t("guidance.title")}
            description={t("guidance.description")}
          />
        </Reveal>

        <div className={s.guidanceGrid}>
          {/* Tab list: vertical on desktop, horizontal scroller on mobile */}
          <div className={s.tabList} role="tablist" aria-label={t("guidance.tablist")}>
            {GUIDANCE_TABS.map((item, i) => {
              const Icon = item.icon;
              const selected = item.id === active;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[item.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls="guidance-panel"
                  tabIndex={selected ? 0 : -1}
                  className={selected ? s.tabOn : s.tab}
                  onClick={() => setActive(item.id)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                >
                  <span className={s.tabNum}>
                    {formatNumber(i + 1, { minimumIntegerDigits: 2 })}
                  </span>
                  <Icon aria-hidden="true" className={s.tabIcon} />
                  <span>{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>

          {/* Panel */}
          <div className={s.panelWrap}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab.id}
                id="guidance-panel"
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                className={s.panel}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <Badge variant="accent">{t(tab.labelKey)}</Badge>
                <h3 className={s.panelTitle}>{t(tab.titleKey)}</h3>
                <p className={s.panelText}>{t(tab.descriptionKey)}</p>

                <p className={s.panelLabel}>{t("guidance.howLabel")}</p>
                <ul className={s.points}>
                  {tab.pointKeys.map((key) => (
                    <li key={key}>
                      <LuCheck aria-hidden="true" />
                      <span>{t(key)}</span>
                    </li>
                  ))}
                </ul>

                <p className={s.panelNext}>
                  <span>{t("guidance.leadsTo")}</span>
                  <LuArrowRight className={s.dirIcon} aria-hidden="true" />
                  <strong>{t(tab.nextKey)}</strong>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
}
