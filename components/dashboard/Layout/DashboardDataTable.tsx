/**
 * DashboardDataTable
 *
 * Responsibilities:
 *  - Generic, presentational table for dashboard lists: column definitions,
 *    rows, a stable row key, a loading state and an empty state.
 *  - No state, effects, data fetching, sorting, filtering or pagination, so it
 *    works in Server and Client Components. Note that `render` callbacks are
 *    functions, so a Server Component can only pass them if this table is
 *    rendered in that same Server Component (not through a Client boundary).
 *
 * Conventions reused from the existing dashboard components:
 *  - White surface, #DCE7E2 border, rounded-xl, muted slate secondary text.
 *  - DashboardEmptyState for the empty case (it renders an <h3>, so place the
 *    table under an <h2> section or DashboardPageHeader).
 *
 * Responsive behaviour:
 *  - The table keeps its natural width (`min-w-full`) inside a horizontally
 *    scrolling wrapper, so wide tables scroll within their own box instead of
 *    stretching the page. The wrapper is a focusable named region so keyboard
 *    users can scroll it with the arrow keys.
 *  - `text-start` and logical alignment keep it RTL-friendly.
 *
 * Cell values:
 *  - With `render`, the cell shows whatever the callback returns.
 *  - Without it, the table reads an own property named `key` from the row and
 *    shows it only if it is a string or number. Anything else renders empty.
 *    This avoids type assertions and `any`. For computed or action columns
 *    (e.g. a "Manage" link), use any unique `key` plus a `render` callback.
 */

import type { ReactNode } from "react";

import DashboardEmptyState from "./DashboardEmptyState";

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

export interface DashboardTableColumn<T> {
  /** Unique within the table. Also the property read when `render` is omitted. */
  key: string;
  /** Column header content. Keep it short and text-based for screen readers. */
  header: ReactNode;
  /** Custom cell content. Receives the full row. */
  render?: (row: T) => ReactNode;
  /** Extra classes applied to both the header and body cells of this column. */
  className?: string;
}

export interface DashboardDataTableProps<T extends object> {
  columns: DashboardTableColumn<T>[];
  rows: T[];
  /** Must return a value that is unique and stable for each row (e.g. its id). */
  getRowKey: (row: T, index: number) => string;

  /** Accessible name for the table, announced by screen readers. */
  caption?: string;

  /** Shows a loading message instead of the table. */
  isLoading?: boolean;
  loadingLabel?: string;

  /** Shown when `rows` is empty and the table is not loading. */
  emptyTitle?: string;
  emptyDescription?: string;
}

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/**
 * Reads a column value from a row without `any` or assertions.
 * `getOwnPropertyDescriptor(...).value` is assigned to `unknown`, then narrowed.
 * Only own data properties are read, which covers plain objects and records.
 */
function readCell(row: object, key: string): ReactNode {
  const value: unknown = Object.getOwnPropertyDescriptor(row, key)?.value;
  if (typeof value === "string" || typeof value === "number") return value;
  return null;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]";

/* ----------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */

export default function DashboardDataTable<T extends object>({
  columns,
  rows,
  getRowKey,
  caption,
  isLoading = false,
  loadingLabel = "Loading data…",
  emptyTitle = "No records found",
  emptyDescription = "There is nothing to show here yet.",
}: DashboardDataTableProps<T>) {
  if (isLoading) {
    return (
      // role="status" is a polite live region, so the message is announced
      // without stealing focus.
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-3 rounded-xl border border-[#DCE7E2] bg-white px-6 py-12 text-sm text-[#64748B]"
      >
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-[#DCE7E2] border-t-[#0B6B4F] motion-reduce:animate-none"
        />
        <span>{loadingLabel}</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return <DashboardEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div
      role="region"
      aria-label={caption ?? "Data table"}
      // Focusable so keyboard users can scroll the table horizontally.
      tabIndex={0}
      className={`overflow-x-auto rounded-xl border border-[#DCE7E2] bg-white ${FOCUS_RING}`}
    >
      <table className="min-w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead className="bg-[#F8FAFC]">
          <tr className="border-b border-[#DCE7E2]">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-[#64748B] ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#DCE7E2]">
          {rows.map((row, index) => (
            <tr key={getRowKey(row, index)} className="transition-colors hover:bg-[#F8FAFC]">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-start align-middle text-[#053B2E] ${column.className ?? ""}`}
                >
                  {column.render ? column.render(row) : readCell(row, column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}