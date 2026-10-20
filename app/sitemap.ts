
import type { MetadataRoute } from "next";

const baseUrl = "https://afghanustad.com";
const locales = ["en", "fa", "ps"];

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    changeFrequency: "weekly",
    priority: 1,
    alternates: {
      languages: {
        en: `${baseUrl}/en`,
        fa: `${baseUrl}/fa`,
        ps: `${baseUrl}/ps`,
      },
    },
  }));
}
