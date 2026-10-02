"use client";

/**
 * ContactDetails
 * ---------------------------------------------------------------------------
 * Deep-green information panel. Each detail is a large tappable row
 * (tel: / mailto:). Rows come from data.ts and appear only if the data
 * exists (address / hours are hidden until verified). The background texture
 * is a topographic "contour" pattern drawn with CSS — decorative, and
 * deliberately NOT a map.
 * Phone and email are wrapped in dir="ltr" so digits and @ stay in the right
 * order inside Persian / Pashto text.
 */
import { useLocale, useTranslations } from "next-intl";
import { LuArrowRight, LuClock, LuMail, LuMapPin, LuPhone } from "react-icons/lu";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { CONTACT, CONTACT_NAMESPACE } from "./data";
import s from "./contact.module.css";

export function ContactDetails() {
  const t = useTranslations(CONTACT_NAMESPACE);
  const locale = useLocale();

  return (
    <div className={s.details}>
      <span className={s.contours} aria-hidden="true" />

      <div className={s.detailsHead}>
        <p className={s.darkEyebrow}>{t("details.eyebrow")}</p>
        <h2 className={s.detailsTitle}>{t("details.title")}</h2>
        <p className={s.detailsText}>{t("details.text")}</p>
      </div>

      <Stagger>
        <div className={s.rows}>
          <StaggerItem>
            <a className={s.row} href={`tel:${CONTACT.phone.tel}`}>
                <span className={s.rowIcon}>
                  <LuPhone aria-hidden="true" />
                </span>
                <span className={s.rowText}>
                  <span className={s.rowLabel}>{t("details.phone")}</span>
                  <bdi className={s.rowValue} dir="ltr">
                    {CONTACT.phone.display}
                  </bdi>
                  <span className={s.rowHint}>{t("details.phoneHint")}</span>
                </span>
                <LuArrowRight className={`${s.rowArrow} ${s.dirIcon}`} aria-hidden="true" />
            </a>
          </StaggerItem>

          <StaggerItem>
            <a className={s.row} href={`mailto:${CONTACT.email.address}`}>
                <span className={s.rowIcon}>
                  <LuMail aria-hidden="true" />
                </span>
                <span className={s.rowText}>
                  <span className={s.rowLabel}>{t("details.email")}</span>
                  <bdi className={s.rowValue} dir="ltr">
                    {CONTACT.email.address}
                  </bdi>
                  <span className={s.rowHint}>{t("details.emailHint")}</span>
                </span>
                <LuArrowRight className={`${s.rowArrow} ${s.dirIcon}`} aria-hidden="true" />
            </a>
          </StaggerItem>

          {/* Optional rows: rendered only when verified data exists */}
          {CONTACT.address && (
            <StaggerItem>
              <div className={`${s.row} ${s.rowStatic}`}>
                <span className={s.rowIcon}>
                  <LuMapPin aria-hidden="true" />
                </span>
                <span className={s.rowText}>
                  <span className={s.rowLabel}>{t("details.address")}</span>
                  <span className={s.rowValue}>{CONTACT.address[locale as "en" | "fa" | "ps"] ?? CONTACT.address.en}</span>
                </span>
              </div>
            </StaggerItem>
          )}
          {CONTACT.hours && (
            <StaggerItem>
              <div className={`${s.row} ${s.rowStatic}`}>
                <span className={s.rowIcon}>
                  <LuClock aria-hidden="true" />
                </span>
                <span className={s.rowText}>
                  <span className={s.rowLabel}>{t("details.hours")}</span>
                  <span className={s.rowValue}>{CONTACT.hours[locale as "en" | "fa" | "ps"] ?? CONTACT.hours.en}</span>
                </span>
              </div>
            </StaggerItem>
          )}
        </div>
      </Stagger>

      <p className={s.detailsNote}>{t("details.formNote")}</p>
    </div>
  );
}
