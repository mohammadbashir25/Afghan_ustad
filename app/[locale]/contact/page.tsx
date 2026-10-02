/**
 * /[locale]/contact
 * ---------------------------------------------------------------------------
 * Hero → split card (details + form) → talk / FAQ prompts → final CTA.
 */
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactHero } from "@/components/contact/ContactHero";
import { ContactSection } from "@/components/contact/ContactSection";
import { ContactMethods } from "@/components/contact/ContactMethods";
import { ContactCTA } from "@/components/contact/ContactCTA";
import { CONTACT_NAMESPACE } from "@/components/contact/data";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: `${CONTACT_NAMESPACE}.meta` });
  return { title: t("title"), description: t("description") };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <ContactHero />
      <ContactSection />
      <ContactMethods />
      <ContactCTA />
    </main>
  );
}
