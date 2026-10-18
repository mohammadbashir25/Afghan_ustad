/**
 * Super Admin: Courses (Server Component).
 *
 * Rendered inside the shell by app/admin/layout.tsx, which handles
 * authentication and the <html>/<body> tags.
 *
 * Data:
 *  - The data layer doesn't exist yet, so `courses` is an empty, typed array.
 *    No courses, counts or statistics are invented. When the backend is ready,
 *    replace that constant with a real query and keep the `CourseRow` shape
 *    (or map your Mongoose documents into it, converting _id and dates to
 *    strings).
 *
 * Search and filters:
 *  - Same pattern as the Students page: a plain GET form that only updates the
 *    URL (?q=...&status=...), so no client JavaScript or state is needed.
 *  - The page applies the params with `filterCourses`, which runs on an empty
 *    array today, so a note says nothing can be returned yet. When a real
 *    query exists, move the same logic into the query itself.
 *
 * Headings: <h1> comes from DashboardHeader; DashboardPageHeader and the
 * visually hidden "Course catalogue" heading are <h2>; the empty state is <h3>.
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
import Course from "@/models/Course";
import { requireRole } from "@/lib/auth/requireRole";

export const metadata: Metadata = {
  title: "Courses",
};

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

const COURSE_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;
type CourseStatus = (typeof COURSE_STATUSES)[number];

const STATUS_LABELS: Record<CourseStatus, string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
};

// Badge colours reuse the existing palette.
const STATUS_STYLES: Record<CourseStatus, string> = {
  ACTIVE: "bg-[#E6F4EE] text-[#053B2E]",
  DRAFT: "bg-[#FFF4C2] text-[#12372E]",
  ARCHIVED: "bg-[#F1F5F3] text-[#64748B]",
};

/** Row shape for the table. Plain strings only, so it is easy to serialize. */
interface CourseRow {
  /** Database id; used for the row key and the detail link. */
  id: string;
  title: string;
  category: string;
  /** Free text for now, e.g. "8 weeks". Switch to a number + unit if needed. */
  duration: string;
  status: CourseStatus;
  /** ISO 8601 date string. */
  createdAt: string;
}

function isCourseStatus(value: string): value is CourseStatus {
  return (COURSE_STATUSES as readonly string[]).includes(value);
}

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function filterCourses(
  rows: CourseRow[],
  query: string,
  status: CourseStatus | null,
): CourseRow[] {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (status && row.status !== status) return false;
    if (!needle) return true;
    return row.title.toLowerCase().includes(needle);
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

const columns: DashboardTableColumn<CourseRow>[] = [
  {
    key: "title",
    header: "Course",
    className: "min-w-56",
    render: (course) => (
      <span className="font-medium text-[#053B2E]">{course.title}</span>
    ),
  },
  {
    key: "category",
    header: "Category",
    className: "min-w-36 text-[#64748B]",
  },
  {
    key: "duration",
    header: "Duration",
    className: "whitespace-nowrap text-[#64748B]",
  },
  {
    key: "status",
    header: "Status",
    className: "whitespace-nowrap",
    render: (course) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[course.status]}`}
      >
        {STATUS_LABELS[course.status]}
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    className: "whitespace-nowrap text-[#64748B]",
    render: (course) => formatDate(course.createdAt),
  },

  {
    key: "actions",
    header: "Actions",
    className: "whitespace-nowrap",
    render: (course) => (
      <Link
        href={`/admin/courses/${course.id}/edit`}
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

interface CoursesPageProps {
  // In Next.js 15+ searchParams is a Promise and must be awaited.
  searchParams: Promise<{ q?: SearchParamValue; status?: SearchParamValue }>;
}

export default async function AdminCoursesPage({
  searchParams,
}: CoursesPageProps) {
  await requireRole(["SUPER_ADMIN", "MANAGER"]);
  await connectDB();
  const docs = await Course.find().sort({ createdAt: -1 }).limit(500).lean();
  const courses: CourseRow[] = docs.map((doc) => ({
    id: String(doc._id),
    title: doc.title,
    category: doc.category,
    duration: doc.duration,
    status: doc.status as CourseStatus,
    createdAt: new Date(doc.createdAt).toISOString(),
  }));
  const params = await searchParams;
  const query = firstValue(params.q).trim();
  const statusParam = firstValue(params.status);
  // Unknown status values in the URL are ignored rather than trusted.
  const status = isCourseStatus(statusParam) ? statusParam : null;
  const hasFilters = query !== "" || status !== null;

  const visibleCourses = filterCourses(courses, query, status);

  // Honest empty-state copy: only claim "no matches" when there is data to match.
  const emptyTitle =
    hasFilters && courses.length > 0
      ? "No courses match your filters"
      : "No courses yet";
  const emptyDescription =
    hasFilters && courses.length > 0
      ? "Try a different search term or clear the filters."
      : "Use “Add Course” to create the first course record.";

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Learning"
        title="Courses"
        description="Administrators will manage the course catalogue, course details and course availability here."
        actions={
          <Link
            href="/admin/courses/new"
            className={`inline-flex h-10 items-center justify-center rounded-lg bg-[#0B6B4F] px-4 text-sm font-medium text-white transition-colors hover:bg-[#053B2E] ${FOCUS_RING}`}
          >
            Add Course
          </Link>
        }
      />

      <section aria-labelledby="course-catalogue-heading" className="space-y-4">
        <h2 id="course-catalogue-heading" className="sr-only">
          Course catalogue
        </h2>

        {/* Plain GET form: updates the URL only, no client state. */}
        <form
          role="search"
          method="get"
          action="/admin/courses"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="course-search" className="sr-only">
              Search courses
            </label>
            <div className="relative">
              <FiSearch
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]"
              />
              <input
                id="course-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search by course title"
                autoComplete="off"
                className={`${FIELD} ps-9 pe-3`}
              />
            </div>
          </div>

          <div className="sm:w-44">
            <label htmlFor="course-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="course-status"
              name="status"
              defaultValue={status ?? ""}
              className={`${FIELD} px-3`}
            >
              <option value="">All statuses</option>
              {COURSE_STATUSES.map((value) => (
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
                href="/admin/courses"
                className={`inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F3] hover:text-[#12372E] ${FOCUS_RING}`}
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {/* Disappears automatically once real records exist. */}
        {courses.length === 0 && (
          <p className="text-xs text-[#64748B]">
            Course records are not connected yet, so search and filters cannot
            return any results.
          </p>
        )}

        <DashboardDataTable<CourseRow>
          caption="Courses"
          columns={columns}
          rows={visibleCourses}
          getRowKey={(course) => course.id}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </section>
    </div>
  );
}
