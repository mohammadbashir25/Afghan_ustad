"use client";

/**
 * ContactMethods
 * ---------------------------------------------------------------------------
 * Two calm prompts under the form: "prefer to talk?" (a tel: link — a real,
 * verified destination) and "quick answers?" (the FAQ). Separated by a
 * vertical Divider on desktop. No WhatsApp link is shown, because no verified
 * WhatsApp destination exists yet.
 */
import { useTranslations } from "next-intl";
import { LuArrowRight, LuPhone } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Reveal } from "@/components/ui/Reveal";
import { CONTACT, CONTACT_NAMESPACE, CONTACT_ROUTES } from "./data";
import s from "./contact.module.css";

export function ContactMethods() {
  const t = useTranslations(CONTACT_NAMESPACE);

  return (
    <section className={`${s.section} ${s.methods}`}>
      <Container>
        <Reveal direction="up">
          <div className={s.methodsGrid}>
            <div className={s.method}>
              <h2 className={s.methodTitle}>{t("methods.callTitle")}</h2>
              <p className={s.methodText}>{t("methods.callText")}</p>
              <Button
                variant="primary"
                size="md"
                href={`tel:${CONTACT.phone.tel}`}
                icon={<LuPhone aria-hidden="true" />}
              >
                {t("methods.callAction")}
              </Button>
            </div>

            <Divider orientation="vertical" className={s.methodsDivider} />

            <div className={s.method}>


            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
