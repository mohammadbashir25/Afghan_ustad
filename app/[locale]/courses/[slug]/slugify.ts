/**
 * Slug helpers
 * ---------------------------------------------------------------------------
 * Rules this project follows for course slugs:
 *  - built from the ENGLISH title, lowercase, words joined by "-"
 *  - the same slug is used for en / fa / ps (only the /[locale] prefix changes)
 *  - unique, and never edited after publishing (links, SEO, bookmarks)
 * Persian/Pashto titles can't be slugified to ASCII, so always slugify the
 * English title.
 */

/** "HTML & CSS Web Design" → "html-and-css-web-design" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-") // anything else → hyphen
    .replace(/^-+|-+$/g, ""); // trim hyphens
}

/** Validates a slug before saving it (e.g. in a CMS/admin form). */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
