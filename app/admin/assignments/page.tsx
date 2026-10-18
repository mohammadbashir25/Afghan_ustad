/**
 * Super Admin: Assignments (Server Component).
 *
 * Rendered inside the shell by app/admin/layout.tsx, which handles
 * authentication and the <html>/<body> tags.
 *
 * Data:
 *  - The data layer doesn't exist yet, so `assignments` is an empty, typed
 *    array. No assignments, courses, classes, due dates or statistics are
 *    invented. When the backend is ready, replace that constant with a real
 *    query and keep the `AssignmentRow` shape (or map your Mongoose documents
 *    into it, converting _id and dates to strings and resolving the course
 *    and class to display names).
 *
 * Search and filters:
 *  - Same pattern as the Courses, Classes and Attendance pages: a plain GET
 *    form that only updates the URL (?q=...&status=...), so no client
 *    JavaScript or state is needed.
 *  - The page applies the params with `filterAssignments`, which runs on an
 *    empty array today, so a note says nothing can be returned yet. When a
 *    real query exists, move the same logic into the query itself.
 *
 * Headings: <h1> comes from DashboardHeader; DashboardPageHeader and the
 * visually hidden "Assignment records" heading are <h2>; the empty state is
 * <h3>.
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
import { requireRole } from "@/lib/auth/requireRole";
import Assignment from "@/models/Assignment";

export const metadata: Metadata = {
  title: "Assignments",
  description: "Review assignments across courses and Skill Center classes.",
};

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

const ASSIGNMENT_STATUSES = ["DRAFT", "PUBLISHED", "CLOSED"] as const;
type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
};

// Badge colours reuse the existing palette (same family as the other pages).
// Every badge also carries a text label, so meaning never relies on colour.
const STATUS_STYLES: Record<AssignmentStatus, string> = {
  DRAFT: "bg-[#FFF4C2] text-[#12372E]",
  PUBLISHED: "bg-[#E6F4EE] text-[#053B2E]",
  CLOSED: "bg-[#F1F5F3] text-[#64748B]",
};

/** Row shape for the table. Plain strings only, so it is easy to serialize. */
interface AssignmentRow {
  /** Database id; used for the row key and the detail link. */
  id: string;
  title: string;
  /** Display name of the related course (resolve it in the query). */
  courseTitle: string;
  /** Display name of the related class, e.g. a Skill Center class. */
  className: string;
  /** ISO 8601 date string, or null when the assignment has no due date. */
  dueDate: string | null;
  status: AssignmentStatus;
}

function isAssignmentStatus(value: string): value is AssignmentStatus {
  return (ASSIGNMENT_STATUSES as readonly string[]).includes(value);
}

/* ----------------------------------------------------------------------------
 * Data (placeholder)
 * ------------------------------------------------------------------------- */


/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function filterAssignments(
  rows: AssignmentRow[],
  query: string,
  status: AssignmentStatus | null,
): AssignmentRow[] {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (status && row.status !== status) return false;
    if (!needle) return true;
    return [row.title, row.courseTitle, row.className].some((field) =>
      field.toLowerCase().includes(needle),
    );
  });
}

/** Em dash for a missing or unparseable date, same as the other admin pages. */
function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  // Fixed locale and UTC so the output doesn't depend on the server's settings.
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(parsed);
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]";

const FIELD =
  "h-10 w-full rounded-lg border border-[#DCE7E2] bg-white text-sm text-[#12372E] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]";

/* ----------------------------------------------------------------------------
 * Columns
 * ------------------------------------------------------------------------- */

const columns: DashboardTableColumn<AssignmentRow>[] = [
  {
    key: "title",
    header: "Assignment",
    className: "min-w-56",
    render: (assignment) => (
      // The detail route is not built yet; this link 404s until it exists.
      <Link
        href={`/admin/assignments/${assignment.id}`}
        className={`rounded font-medium text-[#053B2E] hover:text-[#0B6B4F] hover:underline ${FOCUS_RING}`}
      >
        {assignment.title}
      </Link>
    ),
  },
  {
    key: "courseTitle",
    header: "Course",
    className: "min-w-48 text-[#64748B]",
  },
  {
    key: "className",
    header: "Class",
    className: "min-w-44 text-[#64748B]",
  },
  {
    key: "dueDate",
    header: "Due date",
    className: "whitespace-nowrap text-[#64748B]",
    render: (assignment) => formatDate(assignment.dueDate),
  },
  {
    key: "status",
    header: "Status",
    className: "whitespace-nowrap",
    render: (assignment) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[assignment.status]}`}
      >
        {STATUS_LABELS[assignment.status]}
      </span>
    ),
  },
];

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

interface AssignmentsPageProps {
  // In Next.js 15+ searchParams is a Promise and must be awaited.
  searchParams: Promise<{ q?: SearchParamValue; status?: SearchParamValue }>;
}

export default async function AdminAssignmentsPage({ searchParams }: AssignmentsPageProps) {
  await requireRole(["SUPER_ADMIN"]);
  await connectDB();
  const docs = await Assignment.find().populate("course", "title").populate("class", "name").sort({ createdAt: -1 }).limit(2000).lean();
  const assignments: AssignmentRow[] = docs.map((doc) => ({ id: String(doc._id), title: doc.title, courseTitle: (doc.course as unknown as {title?:string}|null)?.title ?? "Unknown course", className: (doc.class as unknown as {name?:string}|null)?.name ?? "All course students", dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString() : null, status: doc.status as AssignmentStatus }));
  const params = await searchParams;
  const query = firstValue(params.q).trim();
  const statusParam = firstValue(params.status);
  // Unknown status values in the URL are ignored rather than trusted.
  const status = isAssignmentStatus(statusParam) ? statusParam : null;
  const hasFilters = query !== "" || status !== null;

  const visibleAssignments = filterAssignments(assignments, query, status);

  // Honest empty-state copy: only claim "no matches" when there is data to match.
  const emptyTitle =
    hasFilters && assignments.length > 0
      ? "No assignments match your filters"
      : "No assignments yet";
  const emptyDescription =
    hasFilters && assignments.length > 0
      ? "Try a different search term or clear the filters."
      : "Create an assignment to publish work for students. Assignments will appear here when records are connected.";

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Academic"
        title="Assignments"
        description="Administrators can review assignments across courses and Skill Center classes here."
        actions={
          // The target page doesn't exist yet; the link is prepared for later.
          <Link
            href="/admin/assignments/new"
            className={`inline-flex h-10 items-center justify-center rounded-lg bg-[#0B6B4F] px-4 text-sm font-medium text-white transition-colors hover:bg-[#053B2E] ${FOCUS_RING}`}
          >
            Add Assignment
          </Link>
        }
      />

      <section aria-labelledby="assignment-records-heading" className="space-y-4">
        <h2 id="assignment-records-heading" className="sr-only">
          Assignment records
        </h2>

        {/* Plain GET form: updates the URL only, no client state. */}
        <form
          role="search"
          method="get"
          action="/admin/assignments"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="assignment-search" className="sr-only">
              Search by assignment title, course name or class name
            </label>
            <div className="relative">
              <FiSearch
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]"
              />
              <input
                id="assignment-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search by title, course or class"
                autoComplete="off"
                className={`${FIELD} ps-9 pe-3`}
              />
            </div>
          </div>

          <div className="sm:w-44">
            <label htmlFor="assignment-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="assignment-status"
              name="status"
              defaultValue={status ?? ""}
              className={`${FIELD} px-3`}
            >
              <option value="">All statuses</option>
              {ASSIGNMENT_STATUSES.map((value) => (
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
                href="/admin/assignments"
                className={`inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F3] hover:text-[#12372E] ${FOCUS_RING}`}
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {/* Disappears automatically once real records exist. */}
        {assignments.length === 0 && (
          <p className="text-xs text-[#64748B]">
            Assignment records are not connected yet, so search and filters cannot return any
            results.
          </p>
        )}

        <DashboardDataTable<AssignmentRow>
          caption="Assignments"
          columns={columns}
          rows={visibleAssignments}
          getRowKey={(assignment) => assignment.id}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </section>
    </div>
  );
}