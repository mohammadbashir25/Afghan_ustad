import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { hasLocale } from "next-intl";

import { Noto_Sans, Noto_Sans_Arabic } from "next/font/google";

import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar/Navbar";
import { Footer } from "@/components/layout/Footer/Footer";

import "@/app/globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-sans-arabic",
  display: "swap",
});

// Use your real production domain.
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://afghanustad.com"
).replace(/\/$/, "");

type Props = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const canonicalUrl = `${siteUrl}/${locale}`;

  const languageNames: Record<string, string> = {
    en: "English",
    fa: "Dari",
    ps: "Pashto",
  };

  const descriptions: Record<string, string> = {
    en: "AfghanUstad provides practical computer courses, technology education, and digital skills training in Afghanistan. Learn skills for study, work, and the digital world.",
    fa: "افغان استاد؛ آموزش عملی کمپیوتر، تکنالوژی و مهارت‌های دیجیتال برای رشد تحصیلی و حرفه‌ای در افغانستان.",
    ps: "افغان استاد په افغانستان کې د کمپیوټر، ټکنالوژۍ او ډیجیټلي مهارتونو عملي زده کړې وړاندې کوي.",
  };

  const description = descriptions[locale] ?? descriptions.en;

  return {
    metadataBase: new URL(siteUrl),

    verification: {
      google: "uu0R-QPGPnV7-qKXozdF553XGu-yarUNaoPFovr9i0U",
    },

    title: {
      default: "AfghanUstad | Computer & Technology Education",
      template: "%s | AfghanUstad",
    },

    description,

    keywords: [
      "AfghanUstad",
      "افغان استاد",
      "computer courses Afghanistan",
      "computer training Afghanistan",
      "technology education Afghanistan",
      "computer institute Khost",
      "computer courses Khost",
      "IT courses Afghanistan",
      "digital skills training",
    ],

    authors: [
      {
        name: "AfghanUstad",
        url: siteUrl,
      },
    ],

    creator: "AfghanUstad",
    publisher: "AfghanUstad",

    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${siteUrl}/en`,
        fa: `${siteUrl}/fa`,
        ps: `${siteUrl}/ps`,
      },
    },

    openGraph: {
      type: "website",
      siteName: "AfghanUstad",
      title: "AfghanUstad | Computer & Technology Education",
      description,
      url: canonicalUrl,
      locale: locale === "fa" ? "fa_AF" : locale === "ps" ? "ps_AF" : "en_US",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "AfghanUstad - Computer and Technology Education",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: "AfghanUstad | Computer & Technology Education",
      description,
      images: ["/og-image.png"],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    icons: {
      icon: "/favicon.ico",
    },

    category: "education",
  };
}

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": `${siteUrl}/#organization`,
      name: "AfghanUstad",
      alternateName: "افغان استاد",
      url: siteUrl,
      description:
        "AfghanUstad provides practical computer and technology education and digital skills training in Afghanistan.",
      knowsLanguage: ["en", "fa", "ps"],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "AfghanUstad",
      url: siteUrl,
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      inLanguage: ["en", "fa", "ps"],
    },
  ],
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const direction = locale === "en" ? "ltr" : "rtl";

  return (
    <html
      lang={locale}
      dir={direction}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className={`
          ${notoSans.variable}
          ${notoSansArabic.variable}
          bg-background
          text-foreground
          antialiased
        `}
      >
        <NextIntlClientProvider messages={messages}>
          <header>
            <Navbar />
          </header>

          {children}

          <footer>
            <Footer />
          </footer>
        </NextIntlClientProvider>

        {/* Website traffic analytics */}
        <Analytics />

        {/* Structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
