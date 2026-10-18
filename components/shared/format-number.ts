/**
 * useFormatNumber
 * ---------------------------------------------------------------------------
 * Hydration-safe number formatting.
 *
 * Why: for fa/ps, Node (server) and the browser disagree on BOTH
 *  - the default digit system (server "7" vs client "۷"), and
 *  - the thousands separator (server "1,000" vs client "1.000").
 * We therefore pin the numbering system and turn grouping OFF by default, so
 * both sides print identical text (e.g. "1000"). Works in server and client
 * components. Pass `{ useGrouping: true }` only for client-only output.
 *
 * To show Persian/Pashto digits instead, change NUMBERING_SYSTEM to "arabext".
 */
import { useLocale } from "next-intl";

export const NUMBERING_SYSTEM = "latn" as const; // "latn" = 0-9, "arabext" = ۰-۹

export function useFormatNumber() {
  const locale = useLocale();
  return (value: number, options?: Intl.NumberFormatOptions): string =>
    new Intl.NumberFormat(`${locale}-u-nu-${NUMBERING_SYSTEM}`, {
      useGrouping: false,
      ...options,
    }).format(value);
}