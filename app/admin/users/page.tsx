/**
 * Super Admin: Users (Server Component).
 *
 * Rendered inside the shell by app/admin/layout.tsx. The page also re-checks
 * the SUPER_ADMIN role itself (defence in depth).
 *
 * Data: real users from MongoDB via listUsers(). Only name, email, role,
 * status and creation date are read. The password hash is never selected.
 *
 * Search and filters: a plain GET form that only updates the URL
 * (?q=...&role=...&status=...). Unknown role/status values in the URL are
 * ignored. The filtering itself happens in the database query.
 *
 * Headings: <h1> comes from DashboardHeader. DashboardPageHeader and the
 * visually hidden "User accounts" heading are <h2>.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";

import DashboardDataTable, {
  type DashboardTableColumn,
} from "@/components/dashboard/Layout/DashboardDataTable";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import { requireRole } from "@/lib/auth/requireRole";
import {
  listUsers,
  type UserRow,
  type UserStatusFilter,
} from "@/lib/users/queries";
import { ROLE_LABELS } from "@/lib/users/roles";
import StudentAccountMenu from "@/components/dashboard/users/StudentAccountMenu";

export const metadata: Metadata = {
  title: "Users",
};

/* ----------------------------------------------------------------------------
 * Presentation
 * ------------------------------------------------------------------------- */

const STATUS_FILTERS = ["active", "inactive"] as const;

const STATUS_FILTER_LABELS: Record<UserStatusFilter, string> = {
  active: "Active",
  inactive: "Inactive",
};
const STAFF_ROLES = [
  "SUPER_ADMIN",
  "MANAGER",
  "GUIDE",
  "TEACHER",
  "STAFF",
] as const;

function isStatusFilter(value: string): value is UserStatusFilter {
  return (STATUS_FILTERS as readonly string[]).includes(value);
}

// Every badge also carries a text label, so meaning never relies on colour.
const ROLE_STYLES: Record<UserRow["role"], string> = {
  SUPER_ADMIN: "bg-[#053B2E] text-white",
  MANAGER: "bg-[#E6F4EE] text-[#053B2E]",
  GUIDE: "bg-[#FFF4C2] text-[#12372E]",
  STUDENT: "bg-[#F1F5F3] text-[#64748B]",
  TEACHER: "bg-sky-100 text-sky-800",
  STAFF: "bg-violet-100 text-violet-800",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  // Fixed locale and UTC so the output doesn't depend on the server's settings.
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(parsed);
}

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]";

const FIELD =
  "h-10 w-full rounded-lg border border-[#DCE7E2] bg-white text-sm text-[#12372E] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]";

/* ----------------------------------------------------------------------------
 * Columns
 * ------------------------------------------------------------------------- */

// These `render` callbacks are fine here: this Server Component defines them
// and renders DashboardDataTable itself, so no function crosses a client boundary.
const columns: DashboardTableColumn<UserRow>[] = [
  { key: "name", header: "Name", className: "min-w-44 font-medium" },
  { key: "email", header: "Email", className: "min-w-56 text-[#64748B]" },
  {
    key: "role",
    header: "Role",
    className: "whitespace-nowrap",
    render: (user) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[user.role]}`}
      >
        {ROLE_LABELS[user.role]}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    className: "whitespace-nowrap",
    render: (user) =>
      user.isActive ? (
        <span className="inline-flex rounded-full bg-[#E6F4EE] px-2.5 py-0.5 text-xs font-medium text-[#053B2E]">
          Active
        </span>
      ) : (
        <span className="inline-flex rounded-full border border-[#DCE7E2] bg-white px-2.5 py-0.5 text-xs font-medium text-[#64748B]">
          Inactive
        </span>
      ),
  },
  {
    key: "createdAt",
    header: "Created",
    className: "whitespace-nowrap text-[#64748B]",
    render: (user) => formatDate(user.createdAt),
  },
  {
    key: "actions",
    header: "Actions",
    className: "min-w-28 whitespace-nowrap",
    render: (user) => (
      <StudentAccountMenu
        studentId={user.id}
        studentName={user.name}
        isActive={user.isActive}
      />
    ),
  },
];

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

interface UsersPageProps {
  // In Next.js 15+ searchParams is a Promise and must be awaited.
  searchParams: Promise<{
    q?: SearchParamValue;
    role?: SearchParamValue;
    status?: SearchParamValue;
  }>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  // Authorization is re-checked here, not only in the layout.
  await requireRole(["SUPER_ADMIN"]);

  const params = await searchParams;
  const query = firstValue(params.q).trim();
  const roleParam = firstValue(params.role);
  const statusParam = firstValue(params.status);

  // Unknown values in the URL are ignored rather than trusted.
  const role = STAFF_ROLES.includes(roleParam as (typeof STAFF_ROLES)[number])
    ? (roleParam as (typeof STAFF_ROLES)[number])
    : null;
  const status = isStatusFilter(statusParam) ? statusParam : null;
  const hasFilters = query !== "" || role !== null || status !== null;

  const { users, truncated } = await listUsers({ query, role, status });

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="People"
        title="Users"
        description="Review every account on the platform and add new Managers, Guides and Students."
        actions={
          // The /admin/users/new page is built in step 4; this link 404s until then.
          <Link
            href="/admin/users/new"
            className={`inline-flex h-10 items-center justify-center rounded-lg bg-[#0B6B4F] px-4 text-sm font-medium text-white transition-colors hover:bg-[#053B2E] ${FOCUS_RING}`}
          >
            Add User
          </Link>
        }
      />

      <section aria-labelledby="user-accounts-heading" className="space-y-4">
        <h2 id="user-accounts-heading" className="sr-only">
          User accounts
        </h2>

        {/* Plain GET form: updates the URL only, no client state. */}
        <form
          role="search"
          method="get"
          action="/admin/users"
          className="flex flex-col gap-3 lg:flex-row lg:items-end"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="user-search" className="sr-only">
              Search by name or email
            </label>
            <div className="relative">
              <FiSearch
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]"
              />
              <input
                id="user-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search by name or email"
                autoComplete="off"
                maxLength={100}
                className={`${FIELD} ps-9 pe-3`}
              />
            </div>
          </div>

          <div className="lg:w-44">
            <label htmlFor="user-role" className="sr-only">
              Filter by role
            </label>
            <select
              id="user-role"
              name="role"
              defaultValue={role ?? ""}
              className={`${FIELD} px-3`}
            >
              <option value="">All staff roles</option>
              {STAFF_ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:w-44">
            <label htmlFor="user-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="user-status"
              name="status"
              defaultValue={status ?? ""}
              className={`${FIELD} px-3`}
            >
              <option value="">All statuses</option>
              {STATUS_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {STATUS_FILTER_LABELS[value]}
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
                href="/admin/users"
                className={`inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F3] hover:text-[#12372E] ${FOCUS_RING}`}
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        <p className="text-xs text-[#64748B]" aria-live="polite">
          {truncated
            ? "Showing the first 200 users. Use search or filters to narrow the list."
            : `Showing ${users.length} ${users.length === 1 ? "user" : "users"}.`}
        </p>

        <DashboardDataTable<UserRow>
          caption="Users"
          columns={columns}
          rows={users}
          getRowKey={(user) => user.id}
          emptyTitle={
            hasFilters ? "No users match your filters" : "No users found"
          }
          emptyDescription={
            hasFilters
              ? "Try a different search term or clear the filters."
              : "There are no user accounts yet."
          }
        />
      </section>
    </div>
  );
}
