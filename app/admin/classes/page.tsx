/**
 * Super Admin: Classes (Server Component).
 *
 * Rendered inside the shell by app/admin/layout.tsx, which handles
 * authentication and the <html>/<body> tags.
 *
 * Data:
 *  - The data layer doesn't exist yet, so `classes` is an empty, typed array.
 *    No classes, guides, schedules or statistics are invented. When the
 *    backend is ready, replace that constant with a real query and keep the
 *    `ClassRow` shape (or map your Mongoose documents into it, converting _id
 *    and dates to strings and resolving the course and guide to display names).
 *
 * Search and filters:
 *  - Same pattern as the Courses page: a plain GET form that only updates the
 *    URL (?q=...&status=...), so no client JavaScript or state is needed.
 *  - The page applies the params with `filterClasses`, which runs on an empty
 *    array today, so a note says nothing can be returned yet. When a real
 *    query exists, move the same logic into the query itself.
 *
 * Headings: <h1> comes from DashboardHeader; DashboardPageHeader and the
 * visually hidden "Class catalogue" heading are <h2>; the empty state is <h3>.
 *
 * This Server Component defines the column `render` callbacks and renders
 * DashboardDataTable itself, so passing functions is fine.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";

import DashboardDataTable, {
  type DashboardTableColumn,
} from "@/components/dashboard/Layout/DashboardDataTable";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import { requireRole } from "@/lib/auth/requireRole";

export const metadata: Metadata = {
  title: "Classes",
};

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

const CLASS_STATUSES = ["ACTIVE", "UPCOMING", "COMPLETED"] as const;
type ClassStatus = (typeof CLASS_STATUSES)[number];

const STATUS_LABELS: Record<ClassStatus, string> = {
  ACTIVE: "Active",
  UPCOMING: "Upcoming",
  COMPLETED: "Completed",
};

// Badge colours reuse the existing palette (same family as the Courses page).
const STATUS_STYLES: Record<ClassStatus, string> = {
  ACTIVE: "bg-[#E6F4EE] text-[#053B2E]",
  UPCOMING: "bg-[#FFF4C2] text-[#12372E]",
  COMPLETED: "bg-[#F1F5F3] text-[#64748B]",
};

/** Row shape for the table. Plain strings only, so it is easy to serialize. */
interface ClassRow {
  /** Database id; used for the row key and the detail link. */
  id: string;
  name: string;
  /** Display name of the related course (resolve it in the query). */
  courseTitle: string;
  /** Display name of the assigned guide; null when no guide is assigned yet. */
  guideName: string | null;
  /** Free text for now, e.g. "Mon & Wed, 18:00". Replace with a structured value if needed. */
  schedule: string;
  status: ClassStatus;
  /** ISO 8601 date string. */
  createdAt: string;
}

function isClassStatus(value: string): value is ClassStatus {
  return (CLASS_STATUSES as readonly string[]).includes(value);
}

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function filterClasses(
  rows: ClassRow[],
  query: string,
  status: ClassStatus | null,
): ClassRow[] {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (status && row.status !== status) return false;
    if (!needle) return true;
    return row.name.toLowerCase().includes(needle);
  });
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  // Fixed locale and UTC so the output doesn't depend on the server's settings.
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]";

const FIELD =
  "h-10 w-full rounded-lg border border-[#DCE7E2] bg-white text-sm text-[#12372E] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]";

/* ----------------------------------------------------------------------------
 * Columns
 * ------------------------------------------------------------------------- */

const columns: DashboardTableColumn<ClassRow>[] = [
  {
    key: "name",
    header: "Class name",
    className: "min-w-48",
    render: (cls) => (
      <span className="font-medium text-[#053B2E]">{cls.name}</span>
    ),
  },
  {
    key: "courseTitle",
    header: "Course",
    className: "min-w-48 text-[#64748B]",
  },
  {
    key: "guideName",
    header: "Assigned guide",
    className: "min-w-40 text-[#64748B]",
    // A missing guide is shown as plain text, not as a made-up name.
    render: (cls) => cls.guideName ?? "Not assigned",
  },
  {
    key: "schedule",
    header: "Schedule",
    className: "min-w-44 text-[#64748B]",
  },
  {
    key: "status",
    header: "Status",
    className: "whitespace-nowrap",
    render: (cls) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[cls.status]}`}
      >
        {STATUS_LABELS[cls.status]}
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    className: "whitespace-nowrap text-[#64748B]",
    render: (cls) => formatDate(cls.createdAt),
  },
  
{
  key: "actions",
  header: "Actions",
  className: "whitespace-nowrap",
  render: (cls) => (
    <Link
      href={`/admin/classes/${cls.id}/edit`}
      className="font-semibold text-[#0B6B4F] hover:underline"
    >
      Edit
    </Link>
  ),
},

];

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

interface ClassesPageProps {
  // In Next.js 15+ searchParams is a Promise and must be awaited.
  searchParams: Promise<{ q?: SearchParamValue; status?: SearchParamValue }>;
}

export default async function AdminClassesPage({
  searchParams,
}: ClassesPageProps) {
  await requireRole(["SUPER_ADMIN", "MANAGER"]);
  await connectDB();
  const docs = await ClassRecord.find()
    .populate("course", "title")
    .populate("guide", "name")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  const classes: ClassRow[] = docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    courseTitle:
      (doc.course as unknown as { title?: string } | null)?.title ??
      "Course unavailable",
    guideName: (doc.guide as unknown as { name?: string } | null)?.name ?? null,
    schedule: doc.schedule,
    status: doc.status as ClassStatus,
    createdAt: new Date(doc.createdAt).toISOString(),
  }));
  const params = await searchParams;
  const query = firstValue(params.q).trim();
  const statusParam = firstValue(params.status);
  // Unknown status values in the URL are ignored rather than trusted.
  const status = isClassStatus(statusParam) ? statusParam : null;
  const hasFilters = query !== "" || status !== null;

  const visibleClasses = filterClasses(classes, query, status);

  // Honest empty-state copy: only claim "no matches" when there is data to match.
  const emptyTitle =
    hasFilters && classes.length > 0
      ? "No classes match your filters"
      : "No classes yet";
  const emptyDescription =
    hasFilters && classes.length > 0
      ? "Try a different search term or clear the filters."
      : "Use “Add Class” to schedule the first class. An active course is required.";

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Learning"
        title="Classes"
        description="Administrators can manage class schedules, courses, assigned guides and class availability here."
        actions={
          // The target page doesn't exist yet; the link is prepared for later.
          <Link
            href="/admin/classes/new"
            className={`inline-flex h-10 items-center justify-center rounded-lg bg-[#0B6B4F] px-4 text-sm font-medium text-white transition-colors hover:bg-[#053B2E] ${FOCUS_RING}`}
          >
            Add Class
          </Link>
        }
      />

      <section aria-labelledby="class-catalogue-heading" className="space-y-4">
        <h2 id="class-catalogue-heading" className="sr-only">
          Class catalogue
        </h2>

        {/* Plain GET form: updates the URL only, no client state. */}
        <form
          role="search"
          method="get"
          action="/admin/classes"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="class-search" className="sr-only">
              Search classes
            </label>
            <div className="relative">
              <FiSearch
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]"
              />
              <input
                id="class-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search by class name"
                autoComplete="off"
                className={`${FIELD} ps-9 pe-3`}
              />
            </div>
          </div>

          <div className="sm:w-44">
            <label htmlFor="class-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="class-status"
              name="status"
              defaultValue={status ?? ""}
              className={`${FIELD} px-3`}
            >
              <option value="">All statuses</option>
              {CLASS_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className={`inline-flex h-10 items-center justify-center rounded-lg border border-[#0B6B4F] px-4 text-sm font-medium text-[#0B6B4F] transition-colors hover:bg-[#E6F4EE] ${FOCUS_RING}`}
            >
              Apply
            </button>
            {hasFilters && (
              <Link
                href="/admin/classes"
                className={`inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F3] hover:text-[#12372E] ${FOCUS_RING}`}
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {/* Disappears automatically once real records exist. */}
        {classes.length === 0 && (
          <p className="text-xs text-[#64748B]">
            Class records are not connected yet, so search and filters cannot
            return any results.
          </p>
        )}

        <DashboardDataTable<ClassRow>
          caption="Classes"
          columns={columns}
          rows={visibleClasses}
          getRowKey={(cls) => cls.id}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </section>
    </div>
  );
}
