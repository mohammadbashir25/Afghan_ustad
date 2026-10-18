/**
 * Shared chart helpers: AFN and percent formatting, plus Recharts styling.
 *
 * Deliberately NOT a Client Component (no "use client"), so both Server
 * Components (the Finance page formats table amounts with `formatAfn`) and
 * Client Components (the charts) can import the runtime values from here.
 *
 * Rule of thumb for this folder: a Server Component may import TYPES from a
 * "use client" file, but not runtime values. Those would arrive as client
 * references, not the real function or object. Shared runtime values live here.
 */

const afnFormatter = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "AFN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en", { notation: "compact" });

const percentNumberFormatter = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });

/** Formats an amount as AFN. No exchange rates are involved. */
export function formatAfn(amount: number): string {
  return afnFormatter.format(amount);
}

/** Short axis labels such as "12K". */
export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

/** Recharts passes tooltip values loosely typed, so narrow before formatting. */
export function formatTooltipValue(value: unknown): string {
  return typeof value === "number" ? formatAfn(value) : String(value ?? "");
}

/** Formats a value that is already a percentage (0-100), e.g. 92.5 -> "92.5%". */
export function formatPercent(value: number): string {
  return `${percentNumberFormatter.format(value)}%`;
}

/** Tooltip formatter for percentage series. */
export function formatTooltipPercent(value: unknown): string {
  return typeof value === "number" ? formatPercent(value) : String(value ?? "");
}

/* Shared Recharts styling so every chart matches the dashboard palette. */
export const AXIS_TICK = { fill: "#64748B", fontSize: 12 };
export const AXIS_LINE = { stroke: "#DCE7E2" };
export const GRID_STROKE = "#DCE7E2";
export const LEGEND_STYLE = { fontSize: 12, color: "#64748B" };
export const CHART_MARGIN = { top: 8, right: 12, bottom: 0, left: 0 };