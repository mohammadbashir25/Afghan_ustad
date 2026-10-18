import type { Metadata } from "next";
import { FiSearch } from "react-icons/fi";
import Link from "next/link";

import DashboardDataTable, {
  type DashboardTableColumn,
} from "@/components/dashboard/Layout/DashboardDataTable";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import StudentStatusToggle from "@/components/dashboard/users/StudentStatusToggle";
import ResetStudentPinButton from "@/components/dashboard/users/ResetStudentPinButton";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import ClassRecord from "@/models/Class";
import Enrollment from "@/models/Enrollment";

export const metadata: Metadata = {
  title: "Manage Students",
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
  whatsappNumber?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string | null;
};

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams: Promise<{
    q?: SearchParamValue;
    status?: SearchParamValue;
    courseId?: SearchParamValue;
    classId?: SearchParamValue;
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
    header: "Manage Account",
    className: "min-w-40",
    render: (student) => (
      <div className="space-y-2">
        <Link
          href={`/manager/students/${student.id}/edit`}
          className="inline-flex rounded-lg border border-[#DCE7E2] px-3 py-2 text-sm font-medium text-[#0B6B4F] hover:bg-[#E6F4EE]"
        >
          Edit student
        </Link>
        <StudentStatusToggle
          studentId={student.id}
          isActive={student.status === "ACTIVE"}
        />
        {student.status === "ACTIVE" && (
          <ResetStudentPinButton studentId={student.id} />
        )}
      </div>
    ),
  },
];

export default async function ManagerStudentsPage({ searchParams }: PageProps) {
  await requireRole(["MANAGER"]);

  const params = await searchParams;

  const query = firstValue(params.q).trim().slice(0, 100);

  const requestedStatus = firstValue(params.status);
  const status =
    requestedStatus === "active" || requestedStatus === "inactive"
      ? requestedStatus
      : "";

  await connectDB();

  const [courseRecords, classRecords] = await Promise.all([
    Course.find({ status: "ACTIVE" })
      .select("_id title")
      .sort({ title: 1 })
      .lean(),

    ClassRecord.find({ status: "ACTIVE" })
      .select("_id name course schedule")
      .sort({ name: 1 })
      .lean(),
  ]);

  const requestedCourseId = firstValue(params.courseId);
  const requestedClassId = firstValue(params.classId);

  const validCourseId = courseRecords.some(
    (course) => course._id.toString() === requestedCourseId,
  )
    ? requestedCourseId
    : "";

  const availableClasses = validCourseId
    ? classRecords.filter((cls) => cls.course.toString() === validCourseId)
    : classRecords;

  const validClassId = availableClasses.some(
    (cls) => cls._id.toString() === requestedClassId,
  )
    ? requestedClassId
    : "";

  const enrollmentFilter: Record<string, unknown> = {};

  if (validCourseId) {
    enrollmentFilter.course = validCourseId;
  }

  if (validClassId) {
    enrollmentFilter.class = validClassId;
  }

  const hasEnrollmentFilters = Boolean(validCourseId || validClassId);

  const matchingStudentIds = hasEnrollmentFilters
    ? await Enrollment.distinct("student", enrollmentFilter)
    : null;

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

  if (matchingStudentIds !== null) {
    filter._id = { $in: matchingStudentIds };
  }

  const records = await User.find(filter)
    .select("name email whatsappNumber studentId isActive createdAt")
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
  const hasFilters = Boolean(query || status || validCourseId || validClassId);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="People"
        title="Manage Students"
        description="View student accounts, search records, and manage account access."
      />

      <section aria-labelledby="manager-students-heading" className="space-y-4">
        <h2 id="manager-students-heading" className="sr-only">
          Student records
        </h2>

        <form
          role="search"
          method="get"
          action="/manager/students"
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
          <div className="sm:w-52">
            <label htmlFor="student-course" className="sr-only">
              Filter by course
            </label>

            <select
              id="student-course"
              name="courseId"
              defaultValue={validCourseId}
              className={`${FIELD} px-3`}
            >
              <option value="">All courses</option>
              {courseRecords.map((course) => (
                <option
                  key={course._id.toString()}
                  value={course._id.toString()}
                >
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-52">
            <label htmlFor="student-class" className="sr-only">
              Filter by class
            </label>

            <select
              id="student-class"
              name="classId"
              defaultValue={validClassId}
              className={`${FIELD} px-3`}
            >
              <option value="">All active classes</option>
              {availableClasses.map((cls) => (
                <option key={cls._id.toString()} value={cls._id.toString()}>
                  {cls.name} · {cls.schedule}
                </option>
              ))}
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
                href="/manager/students"
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
