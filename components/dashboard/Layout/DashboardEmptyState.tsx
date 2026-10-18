/**
 * DashboardEmptyState
 *
 * Responsibilities:
 *  - Reusable "nothing here yet" panel for dashboard pages and sections:
 *    optional icon, title, description and an optional link action.
 *  - Presentation only. No state, effects or client features, so it works in
 *    both Server and Client Components (no "use client" needed).
 *
 * Conventions reused from the existing dashboard components:
 *  - Dashed border + white surface, matching the Recent Activity empty state
 *    on the Admin Overview page.
 *  - Unprefixed links via next/link (not @/i18n/navigation).
 *  - The same focus ring used by the sidebar, header and overview page.
 *
 * Heading level:
 *  - Renders an <h3>, because pages already have an <h1> (DashboardHeader)
 *    and <h2> section headings (DashboardPageHeader or a section title).
 *    The empty state is typically nested inside such a section.
 *
 * The icon is decorative (aria-hidden), since the title already conveys the
 * meaning. Pass a react-icons element, e.g. <FiUsers className="size-5" />.
 */

import type { ReactNode } from "react";
import Link from "next/link";

export interface DashboardEmptyStateProps {
  title: string;
  description: string;
  /** Decorative icon element. Sizing is up to the caller (size-5 suits the badge). */
  icon?: ReactNode;
  /** The action renders only when BOTH label and href are provided. */
  actionLabel?: string;
  /** Unprefixed dashboard route, e.g. "/admin/courses/new". */
  actionHref?: string;
  /** Optional id for the title, useful for `aria-labelledby` on a wrapper. */
  titleId?: string;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]";

export default function DashboardEmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  titleId,
}: DashboardEmptyStateProps) {
  const hasAction = Boolean(actionLabel && actionHref);

  return (
    <section
      {...(titleId ? { "aria-labelledby": titleId } : {})}
      className="flex flex-col items-center rounded-xl border border-dashed border-[#DCE7E2] bg-white px-6 py-10 text-center sm:py-14"
    >
      {icon && (
        <span
          aria-hidden
          className="mb-4 flex size-11 items-center justify-center rounded-full bg-[#F1F5F3] text-[#0B6B4F]"
        >
          {icon}
        </span>
      )}

      <h3 id={titleId} className="text-base font-semibold text-[#053B2E]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#64748B]">{description}</p>

      {hasAction && actionHref && (
        <Link
          href={actionHref}
          className={`mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#0B6B4F] px-4 text-sm font-medium text-white transition-colors hover:bg-[#053B2E] ${FOCUS_RING}`}
        >
          {actionLabel}
        </Link>
      )}
    </section>
  );
}