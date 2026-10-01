import {
  Noto_Sans,
  Noto_Sans_Arabic,
} from "next/font/google";

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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";


import "@/app/globals.css";
import { Navbar } from "@/components/layout/Navbar/Navbar";
import { Footer } from "@/components/layout/Footer/Footer";

type Props = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export const metadata: Metadata = {
  metadataBase: new URL("https://afghanustad.com"),

  title: {
    default: "AfghanUstad | Computer & Technology Education",
    template: "%s | AfghanUstad",
  },

  description:
    "AfghanUstad provides practical computer and technology education in Afghanistan, helping students build useful skills for study, work, and the modern digital world.",

  keywords: [
    "AfghanUstad",
    "افغان استاد",
    "computer courses Afghanistan",
    "computer training Afghanistan",
    "technology education Afghanistan",
    "computer institute Khost",
    "computer courses Khost",
    "IT courses Afghanistan",
    "computer education",
    "technology training",
  ],

  authors: [
    {
      name: "AfghanUstad",
      url: "https://afghanustad.com",
    },
  ],

  creator: "AfghanUstad",
  publisher: "AfghanUstad",

  alternates: {
    canonical: "/en",
    languages: {
      en: "/en",
      fa: "/fa",
      ps: "/ps",
    },
  },

  openGraph: {
    type: "website",
    siteName: "AfghanUstad",
    title: "AfghanUstad | Computer & Technology Education",
    description:
      "Learn practical computer and technology skills with AfghanUstad.",
    url: "https://afghanustad.com/en",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AfghanUstad - Computer and Technology Education",
      },
    ],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "AfghanUstad | Computer & Technology Education",
    description:
      "Learn practical computer and technology skills with AfghanUstad.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: Props) {
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
      </body>
    </html>
  );
}