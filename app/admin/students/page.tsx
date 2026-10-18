import type { Metadata } from "next";
import { FiSearch } from "react-icons/fi";
import Link from "next/link";

import DashboardDataTable, {
  type DashboardTableColumn,
} from "@/components/dashboard/Layout/DashboardDataTable";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import StudentAccountMenu from "@/components/dashboard/users/StudentAccountMenu";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Students",
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string | null;
};

type SearchParamValue = string | string[] | undefined;

type StudentsPageProps = {
  searchParams: Promise<{
    q?: SearchParamValue;
    status?: SearchParamValue;
  }>;
};

function firstValue(value: SearchParamValue): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

const FIELD =
  "h-10 w-full rounded-lg border border-[#DCE7E2] bg-white text-sm text-[#12372E] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2";

const STATUS_STYLES = {
  ACTIVE: "bg-[#E6F4EE] text-[#053B2E]",
  INACTIVE: "bg-[#F1F5F3] text-[#64748B]",
};

const columns: DashboardTableColumn<StudentRow>[] = [
  {
    key: "name",
    header: "Student Name",
    className: "min-w-44 font-medium",
  },
  {
    key: "email",
    header: "WhatsApp / Contact",
    className: "min-w-56 text-[#64748B]",
  },
  {
    key: "status",
    header: "Account Status",
    className: "whitespace-nowrap",
    render: (student) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
          STATUS_STYLES[student.status]
        }`}
      >
        {student.status === "ACTIVE" ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Account Created",
    className: "whitespace-nowrap text-[#64748B]",
    render: (student) => formatDate(student.createdAt),
  },

  {
    key: "actions",
    header: "Actions",
    className: "min-w-28 whitespace-nowrap",
    render: (student) => (
      <StudentAccountMenu
        studentId={student.id}
        studentName={student.name}
        isActive={student.status === "ACTIVE"}
      />
    ),
  },
];

export default async function AdminStudentsPage({
  searchParams,
}: StudentsPageProps) {
  await requireRole(["SUPER_ADMIN"]);

  const params = await searchParams;
  const query = firstValue(params.q).trim().slice(0, 100);
  const requestedStatus = firstValue(params.status);

  const status =
    requestedStatus === "active" || requestedStatus === "inactive"
      ? requestedStatus
      : "";

  await connectDB();

  const filter: Record<string, unknown> = {
    role: "STUDENT",
  };

  if (query) {
    const safeQuery = new RegExp(escapeRegex(query), "i");

    filter.$or = [
      { name: safeQuery },
      { email: safeQuery },
      { studentId: safeQuery },
      { whatsappNumber: safeQuery },
    ];
  }

  if (status) {
    filter.isActive = status === "active";
  }

  const records = await User.find(filter)
    .select("name email whatsappNumber isActive createdAt studentId")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const students: StudentRow[] = records.map((student) => ({
    id: student._id.toString(),
    name: student.name,
    email: student.email || student.whatsappNumber || "—",
    status: student.isActive ? "ACTIVE" : "INACTIVE",
    createdAt: student.createdAt
      ? new Date(student.createdAt).toISOString()
      : null,
  }));

  const hasFilters = Boolean(query || status);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="People"
        title="Students"
        description="View and search student accounts registered on AfghanUstad."
      />

      <section aria-labelledby="student-records-heading" className="space-y-4">
        <h2 id="student-records-heading" className="sr-only">
          Student records
        </h2>

        <form
          role="search"
          method="get"
          action="/admin/students"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="student-search" className="sr-only">
              Search students
            </label>

            <div className="relative">
              <FiSearch
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]"
              />

              <input
                id="student-search"
                name="q"
                type="search"
                maxLength={100}
                defaultValue={query}
                placeholder="Search by name, student ID, or WhatsApp"
                className={`${FIELD} ps-9 pe-3`}
              />
            </div>
          </div>

          <div className="sm:w-44">
            <label htmlFor="student-status" className="sr-only">
              Filter by account status
            </label>

            <select
              id="student-status"
              name="status"
              defaultValue={status}
              className={`${FIELD} px-3`}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className={`inline-flex h-10 items-center justify-center rounded-lg border border-[#0B6B4F] px-4 text-sm font-medium text-[#0B6B4F] hover:bg-[#E6F4EE] ${FOCUS_RING}`}
            >
              Apply
            </button>

            {hasFilters && (
              <Link
                href="/admin/students"
                className={`inline-flex h-10 items-center rounded-lg px-3 text-sm text-[#64748B] hover:bg-[#F1F5F3] ${FOCUS_RING}`}
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        <p className="text-xs text-[#64748B]" aria-live="polite">
          Showing {students.length}{" "}
          {students.length === 1 ? "student" : "students"}.
          {students.length === 200
            ? " The list is limited to 200 accounts; use search to narrow it."
            : ""}
        </p>

        <DashboardDataTable<StudentRow>
          caption="Students"
          columns={columns}
          rows={students}
          getRowKey={(student) => student.id}
          emptyTitle={
            hasFilters
              ? "No students match your filters"
              : "No student accounts yet"
          }
          emptyDescription={
            hasFilters
              ? "Try another search term or change the status filter."
              : "Student accounts will appear here after they are created."
          }
        />
      </section>
    </div>
  );
}
