/**
 * DashboardPageHeader
 *
 * Responsibilities:
 *  - In-page heading block: optional eyebrow, title, optional description and
 *    optional page-level actions (buttons, links, filters).
 *  - Layout only. It holds no state and needs no client features, so it works
 *    in both Server and Client Components.
 *
 * Heading level:
 *  - DashboardHeader already renders the page's <h1> from the shell's `title`,
 *    so this component renders an <h2> to keep a single <h1> per page.
 *
 * Layout notes:
 *  - Stacked on mobile; from `sm` up, text sits at the start and actions at
 *    the end. Logical properties are not needed because flex order follows
 *    the writing direction, so this mirrors automatically under dir="rtl".
 *  - `min-w-0` on the text block lets long titles wrap instead of pushing the
 *    actions out of the container.
 */

import type { ReactNode } from "react";

export interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  /** Small label above the title, e.g. a section or category name. */
  eyebrow?: string;
  /** Page-specific controls. Rendered as given, so pass your own buttons. */
  actions?: ReactNode;
  /** Optional id for the title, useful for `aria-labelledby` on the page. */
  titleId?: string;
}

export default function DashboardPageHeader({
  title,
  description,
  eyebrow,
  actions,
  titleId,
}: DashboardPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-[#DCE7E2] pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#0B6B4F]">
            {eyebrow}
          </p>
        )}
        <h2
          id={titleId}
          className="text-xl font-semibold leading-tight text-[#053B2E] sm:text-2xl"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#64748B] sm:text-[15px]">
            {description}
          </p>
        )}
      </div>

      {/* flex-wrap keeps several buttons usable on narrow screens;
          shrink-0 stops the group from being squeezed beside long titles. */}
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}