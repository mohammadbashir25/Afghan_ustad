import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import Payment from "@/models/Payment";

export const metadata = {
  title: "Registration & Enrollment Report | AfghanUstad",
};

type SearchParams = Promise<{
  from?: string;
  to?: string;
  q?: string;
}>;

type PersonInfo = {
  _id?: unknown;
  name?: string;
  studentId?: string;
  fatherName?: string;
  whatsappNumber?: string;
  registrationDate?: Date | string;
  createdAt?: Date | string;
};

type ClassInfo = {
  _id?: unknown;
  name?: string;
  schedule?: string;
  teacher?: PersonInfo | null;
  guide?: PersonInfo | null;
};

type StudentRegistration = {
  _id: unknown;
  name: string;
  fatherName?: string;
  studentId?: string;
  username?: string;
  whatsappNumber?: string;
  registrationDate?: Date | string;
  createdAt?: Date | string;
  courseName?: string;
  courseFee?: number;
  discountAmount?: number;
  isActive?: boolean;
  class?: ClassInfo | null;
};

type EnrollmentRecord = {
  _id: unknown;
  student?: PersonInfo | null;
  courseName?: string;
  class?: ClassInfo | null;
  enrolledAt?: Date | string;
  courseFee?: number;
  discountAmount?: number;
  status?: string;
};

type PaymentRecord = {
  _id: unknown;
  student?: PersonInfo | null;
  receivedBy?: PersonInfo | null;
  class?: { name?: string } | null;
  enrollment?: unknown;
  amountPaid?: number;
  paidAt?: Date | string;
  receiptNumber?: string;
  studentName?: string;
  studentId?: string;
  courseName?: string;
  method?: string;
};

type PaymentBalanceRecord = {
  enrollment?: unknown;
  amountPaid?: number;
};

function formatMoney(value: number) {
  return `${(Number(value) || 0).toLocaleString("en-US")} AFN`;
}

function formatDate(value?: Date | string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kabul",
  }).format(date);
}

function getKabulDateString(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kabul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getDefaultDateRange() {
  const today = new Date();
  const from = new Date(today);

  // Five calendar days, including today.
  from.setUTCDate(from.getUTCDate() - 4);

  return {
    from: getKabulDateString(from),
    to: getKabulDateString(today),
  };
}

function isValidDateString(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

/**
 * Date inputs are Afghanistan calendar dates.
 * Kabul is UTC+04:30.
 *
 * The upper boundary is exclusive, so the entire selected
 * "To" date is included.
 */
function makeDateFilter(from: string, to: string) {
  const start = new Date(`${from}T00:00:00+04:30`);

  const nextDay = new Date(`${to}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const nextDayString = nextDay.toISOString().slice(0, 10);
  const end = new Date(`${nextDayString}T00:00:00+04:30`);

  return {
    $gte: start,
    $lt: end,
  };
}

function getId(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "object" && "_id" in value) {
    return String(value._id ?? "");
  }

  return String(value);
}

function getPersonName(person?: PersonInfo | null) {
  return person?.name || "—";
}

function formatClass(classInfo?: ClassInfo | null) {
  if (!classInfo) return "Not assigned";

  const parts = [
    classInfo.name || "Class not assigned",
    classInfo.teacher?.name
      ? `Teacher: ${classInfo.teacher.name}`
      : null,
    classInfo.guide?.name
      ? `Guide: ${classInfo.guide.name}`
      : null,
    classInfo.schedule || null,
  ].filter(Boolean);

  return parts.join(" • ");
}

function includesSearch(values: unknown[], search: string) {
  if (!search) return true;

  const text = values
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLowerCase();

  return text.includes(search.toLowerCase());
}

export default async function RegistrationEnrollmentReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["SUPER_ADMIN"]);
  await connectDB();

  const params = await searchParams;
  const defaults = getDefaultDateRange();

  const from = isValidDateString(params.from)
    ? params.from!
    : defaults.from;

  const to = isValidDateString(params.to)
    ? params.to!
    : defaults.to;

  const search = (params.q || "").trim();

  const dateFilter = makeDateFilter(from, to);

  // IMPORTANT:
  // Registration records are filtered by registrationDate,
  // NOT by createdAt.
  const studentFilter = {
    role: "STUDENT",
    registrationDate: dateFilter,
  };

  // Each enrollment is filtered by its own enrolledAt date.
  const enrollmentFilter = {
    enrolledAt: dateFilter,
    status: { $ne: "CANCELLED" },
  };

  // Payments are filtered by their actual paidAt date.
  const paymentFilter = {
    paidAt: dateFilter,
  };

  const [
    registrationsRaw,
    enrollmentsRaw,
    periodPaymentsRaw,
    allPaymentsRaw,
  ] = await Promise.all([
    User.find(studentFilter)
      .select(
        "name fatherName studentId username whatsappNumber registrationDate createdAt courseName courseFee discountAmount class isActive",
      )
      .populate({
        path: "class",
        select: "name schedule teacher guide",
        populate: [
          { path: "teacher", select: "name" },
          { path: "guide", select: "name" },
        ],
      })
      .sort({ registrationDate: -1 })
      .limit(2000)
      .lean(),

    Enrollment.find(enrollmentFilter)
      .populate(
        "student",
        "name studentId whatsappNumber registrationDate createdAt",
      )
      .populate({
        path: "class",
        select: "name schedule teacher guide",
        populate: [
          { path: "teacher", select: "name" },
          { path: "guide", select: "name" },
        ],
      })
      .sort({ enrolledAt: -1 })
      .limit(3000)
      .lean(),

    Payment.find(paymentFilter)
      .populate("student", "name studentId")
      .populate("receivedBy", "name")
      .populate({
        path: "class",
        select: "name",
      })
      .sort({ paidAt: -1 })
      .limit(3000)
      .lean(),

    // All payment history is needed to calculate the current
    // balance of enrollments in the selected date range.
    Payment.find()
      .select("enrollment amountPaid")
      .lean(),
  ]);

  const registrations =
    registrationsRaw as unknown as StudentRegistration[];

  const enrollments =
    enrollmentsRaw as unknown as EnrollmentRecord[];

  const periodPayments =
    periodPaymentsRaw as unknown as PaymentRecord[];

  const allPayments =
    allPaymentsRaw as unknown as PaymentBalanceRecord[];

  // Calculate total payments for each enrollment.
  const paidByEnrollment = new Map<string, number>();

  for (const payment of allPayments) {
    const enrollmentId = getId(payment.enrollment);

    if (!enrollmentId) continue;

    const previousAmount = paidByEnrollment.get(enrollmentId) || 0;

    paidByEnrollment.set(
      enrollmentId,
      previousAmount + Number(payment.amountPaid || 0),
    );
  }

  // Search is applied independently to each report section.
  const filteredRegistrations = registrations.filter((student) =>
    includesSearch(
      [
        student.name,
        student.fatherName,
        student.studentId,
        student.username,
        student.whatsappNumber,
        student.courseName,
        student.class?.name,
        student.class?.teacher?.name,
        student.class?.guide?.name,
      ],
      search,
    ),
  );

  const filteredEnrollments = enrollments.filter((enrollment) =>
    includesSearch(
      [
        enrollment.student?.name,
        enrollment.student?.studentId,
        enrollment.student?.whatsappNumber,
        enrollment.courseName,
        enrollment.class?.name,
        enrollment.class?.teacher?.name,
        enrollment.class?.guide?.name,
        enrollment.status,
      ],
      search,
    ),
  );

  const filteredPayments = periodPayments.filter((payment) =>
    includesSearch(
      [
        payment.student?.name,
        payment.studentName,
        payment.student?.studentId,
        payment.studentId,
        payment.courseName,
        payment.receiptNumber,
        payment.method,
      ],
      search,
    ),
  );

  // Summary calculations use the same filtered records shown below.
  const registrationCount = filteredRegistrations.length;
  const enrollmentCount = filteredEnrollments.length;

  const totalCollected = filteredPayments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0,
  );

  // Enrollment.courseFee is already the fee after discount.
  // Do not subtract discount again.
  const totalEnrollmentFees = filteredEnrollments.reduce(
    (sum, enrollment) => sum + Number(enrollment.courseFee || 0),
    0,
  );

  const totalDiscounts = filteredEnrollments.reduce(
    (sum, enrollment) => sum + Number(enrollment.discountAmount || 0),
    0,
  );

  const totalOutstanding = filteredEnrollments.reduce(
    (sum, enrollment) => {
      const paid = paidByEnrollment.get(String(enrollment._id)) || 0;
      const fee = Number(enrollment.courseFee || 0);

      return sum + Math.max(0, fee - paid);
    },
    0,
  );

  return (
    <main className="space-y-6 p-4 md:p-6">
      {/* Page heading */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0B6B4F]">
            ADMINISTRATION / REPORTS
          </p>

          <h1 className="mt-1 text-2xl font-bold text-[#12372E] md:text-3xl">
            Registration & Enrollment Report
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            See exactly who registered, who enrolled, and how much money
            was collected during the selected dates.
          </p>
        </div>

        <Link
          href="/admin/finance"
          className="inline-flex items-center justify-center rounded-xl border border-[#DCE7E2] bg-white px-4 py-2.5 text-sm font-semibold text-[#12372E] hover:bg-[#F8FAFC]"
        >
          Finance & Payments
        </Link>
      </div>

      {/* Date and search filters */}
      <form
        method="GET"
        className="grid gap-3 rounded-2xl border border-[#DCE7E2] bg-white p-4 md:grid-cols-[1fr_1fr_1.5fr_auto_auto]"
      >
        <label className="text-sm font-medium text-slate-700">
          From date
          <input
            type="date"
            name="from"
            defaultValue={from}
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          To date
          <input
            type="date"
            name="to"
            defaultValue={to}
            required
            min={from}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Search
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Student name, ID, phone, course, receipt..."
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>

        <button
          type="submit"
          className="self-end rounded-lg bg-[#0B6B4F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#07543E]"
        >
          Apply
        </button>

        <Link
          href="/admin/registration-enrollment-report"
          className="self-end rounded-lg border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Reset
        </Link>
      </form>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">How the date filter works</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Registrations are filtered by the date selected in the
            registration form.
          </li>
          <li>
            Enrollments are filtered by the enrollment creation date
            (enrolledAt).
          </li>
          <li>
            Payments are filtered by the date the payment was received
            (paidAt).
          </li>
        </ul>
        <p className="mt-2 text-xs text-blue-800">
          Selected period: {from} to {to} (Afghanistan time).
        </p>
      </div>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Student registrations",
            value: registrationCount.toLocaleString(),
            note: "By registration date",
          },
          {
            label: "New enrollments",
            value: enrollmentCount.toLocaleString(),
            note: "By enrolledAt date",
          },
          {
            label: "Money collected",
            value: formatMoney(totalCollected),
            note: "Payments received in this period",
          },
          {
            label: "Enrollment fees",
            value: formatMoney(totalEnrollmentFees),
            note: "Fees after discount",
          },
          {
            label: "Outstanding balance",
            value: formatMoney(totalOutstanding),
            note: "Current balance of these enrollments",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#DCE7E2] bg-white p-4"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 break-words text-xl font-bold text-[#12372E]">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{item.note}</p>
          </div>
        ))}
      </section>

      {/* Student registrations */}
      <section className="overflow-hidden rounded-2xl border border-[#DCE7E2] bg-white">
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#12372E]">
                Student Registrations
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Students whose registration form date falls within the
                selected period.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              {registrationCount} students
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Registration date</th>
                <th className="px-4 py-3">Account created</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Class / Teacher / Guide</th>
                <th className="px-4 py-3">Account status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredRegistrations.map((student) => (
                <tr
                  key={String(student._id)}
                  className="hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {student.name}
                  </td>

                  <td className="px-4 py-3">
                    {student.studentId || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {student.whatsappNumber || "—"}
                  </td>

                  <td className="px-4 py-3 font-semibold text-emerald-700">
                    {formatDate(student.registrationDate)}
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(student.createdAt)}
                  </td>

                  <td className="px-4 py-3">
                    {student.courseName || "—"}
                  </td>

                  <td className="max-w-[280px] px-4 py-3">
                    {formatClass(student.class)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        student.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {student.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredRegistrations.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No student registrations found for this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Enrollment records */}
      <section className="overflow-hidden rounded-2xl border border-[#DCE7E2] bg-white">
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#12372E]">
                Enrollment Records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Every enrollment created during this period, including
                existing students enrolled in another course.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {enrollmentCount} enrollments
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Class / Teacher / Guide</th>
                <th className="px-4 py-3">Original registration</th>
                <th className="px-4 py-3">Enrollment date</th>
                <th className="px-4 py-3">Fee after discount</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Paid to date</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredEnrollments.map((enrollment) => {
                const student = enrollment.student;
                const paid =
                  paidByEnrollment.get(String(enrollment._id)) || 0;

                const fee = Number(enrollment.courseFee || 0);
                const balance = Math.max(0, fee - paid);

                return (
                  <tr
                    key={String(enrollment._id)}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {getPersonName(student)}
                    </td>

                    <td className="px-4 py-3">
                      {student?.studentId || "—"}
                    </td>

                    <td className="px-4 py-3">
                      {enrollment.courseName || "—"}
                    </td>

                    <td className="max-w-[280px] px-4 py-3">
                      {formatClass(enrollment.class)}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(student?.registrationDate)}
                    </td>

                    <td className="px-4 py-3 font-semibold text-blue-700">
                      {formatDate(enrollment.enrolledAt)}
                    </td>

                    <td className="px-4 py-3">
                      {formatMoney(fee)}
                    </td>

                    <td className="px-4 py-3">
                      {formatMoney(enrollment.discountAmount || 0)}
                    </td>

                    <td className="px-4 py-3">
                      {formatMoney(paid)}
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {formatMoney(balance)}
                    </td>

                    <td className="px-4 py-3">
                      {enrollment.status || "—"}
                    </td>
                  </tr>
                );
              })}

              {filteredEnrollments.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No enrollments found for this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          Discounts for these enrollments:{" "}
          <strong className="text-[#12372E]">
            {formatMoney(totalDiscounts)}
          </strong>
        </div>
      </section>

      {/* Payments */}
      <section className="overflow-hidden rounded-2xl border border-[#DCE7E2] bg-white">
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#12372E]">
                Payments Received
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Payments received during the selected period.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              {formatMoney(totalCollected)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Payment date</th>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Amount received</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Received by</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((payment) => (
                <tr
                  key={String(payment._id)}
                  className="hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    {formatDate(payment.paidAt)}
                  </td>

                  <td className="px-4 py-3">
                    {payment.receiptNumber || "—"}
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {payment.student?.name ||
                      payment.studentName ||
                      "Unknown student"}
                  </td>

                  <td className="px-4 py-3">
                    {payment.student?.studentId ||
                      payment.studentId ||
                      "—"}
                  </td>

                  <td className="px-4 py-3">
                    {payment.courseName || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {payment.class?.name || "—"}
                  </td>

                  <td className="px-4 py-3 font-semibold text-emerald-700">
                    {formatMoney(payment.amountPaid || 0)}
                  </td>

                  <td className="px-4 py-3">
                    {payment.method || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {payment.receivedBy?.name || "—"}
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No payments found for this date range.
                  </td>
                </tr>
              )}
            </tbody>

            {filteredPayments.length > 0 && (
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-3 text-right font-bold text-slate-700"
                  >
                    Total collected in this period
                  </td>

                  <td className="px-4 py-3 font-bold text-emerald-700">
                    {formatMoney(totalCollected)}
                  </td>

                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </main>
  );
}