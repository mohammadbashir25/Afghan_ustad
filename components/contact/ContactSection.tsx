/**
 * ContactSection
 * ---------------------------------------------------------------------------
 * The strong split composition: ONE bordered object made of a deep-green
 * information panel and the white form panel, so they read as a single
 * conversation (details → form), not two unrelated boxes.
 * Desktop: 5/12 + 7/12 side by side. Mobile: panel first, form below, sharing
 * the same rounded outline.
 */
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ContactDetails } from "./ContactDetails";
import { ContactForm } from "./ContactForm";
import s from "./contact.module.css";

export function ContactSection() {
  return (
    <section className={`${s.section} ${s.main}`}>
      <Container>
        <Reveal direction="up">
          <div className={s.split}>
            <ContactDetails />
            <ContactForm />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
