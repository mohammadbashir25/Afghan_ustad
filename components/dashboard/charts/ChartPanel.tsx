/**
 * ChartPanel
 *
 * Responsibilities:
 *  - The card shell shared by every dashboard chart: title, description, then
 *    either the chart or an honest empty state.
 *  - Presentation only. It has no "use client" of its own and is rendered
 *    from the chart Client Components, so it runs on the client with them.
 *
 * Why the chart area has a fixed height:
 *  - Recharts' ResponsiveContainer fills its parent, and collapses to 0 if the
 *    parent has no height. `h-64` here is that defined-height parent.
 *
 * Accessibility:
 *  - The chart region is role="img" with a summary label, so screen readers
 *    get one concise description instead of the SVG internals. The underlying
 *    records should also be available elsewhere on the page (for Finance,
 *    the payments table).
 *
 * Heading levels: the title is an <h3> and the empty state an <h4>, because
 * pages already have an <h1> (DashboardHeader) and <h2> section headings.
 */

import type { ReactNode } from "react";

export interface ChartPanelProps {
  title: string;
  description: string;
  hasData: boolean;
  /** Decorative icon for the empty state. */
  emptyIcon: ReactNode;
  /** Accessible summary of the chart, read instead of the SVG internals. */
  chartLabel: string;
  /** Empty-state wording. Defaults suit financial charts. */
  emptyTitle?: string;
  emptyDescription?: string;
  /** Layout classes from the page, e.g. "lg:col-span-2". */
  className?: string;
  children: ReactNode;
}

export default function ChartPanel({
  title,
  description,
  hasData,
  emptyIcon,
  chartLabel,
  emptyTitle = "No data to chart yet",
  emptyDescription = "Financial data will appear here once payment records are connected.",
  className = "",
  children,
}: ChartPanelProps) {
  return (
    <article className={`min-w-0 rounded-xl border border-[#DCE7E2] bg-white p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-[#053B2E]">{title}</h3>
      <p className="mt-0.5 text-xs text-[#64748B]">{description}</p>

      {hasData ? (
        <div role="img" aria-label={chartLabel} className="mt-4 h-64 w-full">
          {children}
        </div>
      ) : (
        <div className="mt-4 flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-[#DCE7E2] bg-[#F8FAFC] px-6 text-center">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-full bg-[#F1F5F3] text-[#0B6B4F]"
          >
            {emptyIcon}
          </span>
          <h4 className="mt-3 text-sm font-medium text-[#053B2E]">{emptyTitle}</h4>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#64748B]">
            {emptyDescription}
          </p>
        </div>
      )}
    </article>
  );
}