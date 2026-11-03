
import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import Payment from "@/models/Payment";

type PersonInfo = {
  name?: string;
  studentId?: string;
  whatsappNumber?: string;
};

type ClassInfo = {
  name?: string;
  schedule?: string;
  teacher?: PersonInfo | null;
  guide?: PersonInfo | null;
};

type StudentRegistration = {
  _id: unknown;
  name: string;
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

type AllPaymentRecord = {
  enrollment?: unknown;
  amountPaid?: number;
};

export const metadata = {
  title: "Registration & Enrollment Report | AfghanUstad",
};

type SearchParams = Promise<{
  from?: string;
  to?: string;
  q?: string;
}>;

const formatMoney = (value: number) =>
  `${(Number(value) || 0).toLocaleString("en-US")} AFN`;

const formatDate = (value?: Date | string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getId = (value: unknown) => String(value ?? "");

function getDefaultDateRange() {
  const today = new Date();
  const from = new Date(today);

  // Five calendar days, including today.
  from.setDate(today.getDate() - 4);

  const toDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    from: toDate(from),
    to: toDate(today),
  };
}

function makeDateFilter(from: string, to: string) {
  const filter: { $gte?: Date; $lt?: Date } = {};

  if (from) {
    filter.$gte = new Date(`${from}T00:00:00.000Z`);
  }

  if (to) {
    const end = new Date(`${to}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    filter.$lt = end;
  }

  return filter;
}

function registrationClass(student: StudentRegistration) {
  const classInfo = student.class;

  if (!classInfo) return "Not assigned";

  const parts = [
    classInfo.name,
    classInfo.teacher?.name
      ? `Teacher: ${classInfo.teacher.name}`
      : null,
    classInfo.guide?.name
      ? `Guide: ${classInfo.guide.name}`
      : null,
    classInfo.schedule,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Not assigned";
}

function enrollmentClass(enrollment: EnrollmentRecord) {
  const classInfo = enrollment.class;

  if (!classInfo) return "Not assigned";

  const parts = [
    classInfo.name,
    classInfo.teacher?.name
      ? `Teacher: ${classInfo.teacher.name}`
      : null,
    classInfo.guide?.name
      ? `Guide: ${classInfo.guide.name}`
      : null,
    classInfo.schedule,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Not assigned";
}

function matchesSearch(
  search: string,
  values: Array<string | undefined | null>,
) {
  if (!search) return true;

  const normalizedSearch = search.toLowerCase();

  return values.some((value) =>
    String(value ?? "").toLowerCase().includes(normalizedSearch),
  );
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

  const from = /^\d{4}-\d{2}-\d{2}$/.test(params.from || "")
    ? params.from!
    : defaults.from;

  const to = /^\d{4}-\d{2}-\d{2}$/.test(params.to || "")
    ? params.to!
    : defaults.to;

  const search = (params.q || "").trim();
  const dateFilter = makeDateFilter(from, to);

  const studentFilter: Record<string, unknown> = {
    role: "STUDENT",
    registrationDate: dateFilter,
  };

  const enrollmentFilter: Record<string, unknown> = {
    enrolledAt: dateFilter,
    status: { $ne: "CANCELLED" },
  };

  const paymentFilter: Record<string, unknown> = {
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
        "name studentId username whatsappNumber registrationDate createdAt courseName courseFee discountAmount class isActive",
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
      .limit(1000)
      .lean(),

    Enrollment.find(enrollmentFilter)
      .populate("student", "name studentId whatsappNumber")
      .populate({
        path: "class",
        select: "name schedule teacher guide",
        populate: [
          { path: "teacher", select: "name" },
          { path: "guide", select: "name" },
        ],
      })
      .sort({ enrolledAt: -1 })
      .limit(2000)
      .lean(),

    Payment.find(paymentFilter)
      .populate("student", "name studentId")
      .populate("receivedBy", "name")
      .populate("class", "name")
      .sort({ paidAt: -1 })
      .limit(2000)
      .lean(),

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
    allPaymentsRaw as unknown as AllPaymentRecord[];

  // Search registrations by student information.
  const filteredRegistrations = registrations.filter((student) =>
    matchesSearch(search, [
      student.name,
      student.studentId,
      student.username,
      student.whatsappNumber,
      student.courseName,
      student.class?.name,
      student.class?.teacher?.name,
      student.class?.guide?.name,
    ]),
  );

  // Search enrollments by student, course, and class.
  const filteredEnrollments = enrollments.filter((enrollment) =>
    matchesSearch(search, [
      enrollment.student?.name,
      enrollment.student?.studentId,
      enrollment.student?.whatsappNumber,
      enrollment.courseName,
      enrollment.class?.name,
      enrollment.class?.teacher?.name,
      enrollment.class?.guide?.name,
    ]),
  );

  // Search payments by student, course, and receipt.
  const filteredPayments = periodPayments.filter((payment) =>
    matchesSearch(search, [
      payment.student?.name,
      payment.student?.studentId,
      payment.studentName,
      payment.studentId,
      payment.courseName,
      payment.receiptNumber,
      payment.class?.name,
      payment.method,
    ]),
  );

  // Calculate all-time payments for each enrollment.
  // This is used for outstanding balances, not the selected date range.
  const paidByEnrollment = new Map<string, number>();

  for (const payment of allPayments) {
    if (!payment.enrollment) continue;

    const enrollmentId = getId(payment.enrollment);
    const amount = Number(payment.amountPaid || 0);

    paidByEnrollment.set(
      enrollmentId,
      (paidByEnrollment.get(enrollmentId) || 0) + amount,
    );
  }

  const totalCollected = filteredPayments.reduce(
    (total, payment) => total + Number(payment.amountPaid || 0),
    0,
  );

  const totalEnrollmentFees = filteredEnrollments.reduce(
    (total, enrollment) =>
      total + Number(enrollment.courseFee || 0),
    0,
  );

  const totalDiscounts = filteredEnrollments.reduce(
    (total, enrollment) =>
      total + Number(enrollment.discountAmount || 0),
    0,
  );

  const totalOutstanding = filteredEnrollments.reduce(
    (total, enrollment) => {
      const paid =
        paidByEnrollment.get(getId(enrollment._id)) || 0;

      const fee = Number(enrollment.courseFee || 0);

      return total + Math.max(0, fee - paid);
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
            Track student registration dates, account creation,
            enrollments, payments, and outstanding balances.
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
          From
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          To
          <input
            type="date"
            name="to"
            defaultValue={to}
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

      <p className="text-xs text-slate-500">
        Date range: {formatDate(`${from}T00:00:00`)} –{" "}
        {formatDate(`${to}T00:00:00`)}. Registration counts use
        registration date, enrollment counts use enrollment date,
        and collected money uses payment date.
      </p>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Student registrations",
            value: filteredRegistrations.length.toLocaleString(),
            note: "By registration date",
          },
          {
            label: "New enrollments",
            value: filteredEnrollments.length.toLocaleString(),
            note: "By enrollment date",
          },
          {
            label: "Money collected",
            value: formatMoney(totalCollected),
            note: "Payments received in this range",
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

            <p className="mt-1 text-xs text-slate-400">
              {item.note}
            </p>
          </div>
        ))}
      </section>

      {/* Registration records */}
      <section className="overflow-hidden rounded-2xl border border-[#DCE7E2] bg-white">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-bold text-[#12372E]">
            Student Registrations
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Registration date and account creation date are displayed
            separately.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
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
                  key={getId(student._id)}
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

                  <td className="px-4 py-3">
                    {formatDate(student.registrationDate)}
                  </td>

                  <td className="px-4 py-3">
                    {formatDate(student.createdAt)}
                  </td>

                  <td className="px-4 py-3">
                    {student.courseName || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {registrationClass(student)}
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
          <h2 className="text-lg font-bold text-[#12372E]">
            Enrollment Records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Each enrollment is listed separately, including additional
            enrollments for existing students.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Class / Teacher / Guide</th>
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
                const paid =
                  paidByEnrollment.get(getId(enrollment._id)) || 0;

                const fee = Number(enrollment.courseFee || 0);
                const balance = Math.max(0, fee - paid);

                return (
                  <tr
                    key={getId(enrollment._id)}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {enrollment.student?.name || "Unknown student"}
                    </td>

                    <td className="px-4 py-3">
                      {enrollment.student?.studentId || "—"}
                    </td>

                    <td className="px-4 py-3">
                      {enrollment.courseName || "—"}
                    </td>

                    <td className="px-4 py-3">
                      {enrollmentClass(enrollment)}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(enrollment.enrolledAt)}
                    </td>

                    <td className="px-4 py-3">
                      {formatMoney(fee)}
                    </td>

                    <td className="px-4 py-3">
                      {formatMoney(
                        Number(enrollment.discountAmount || 0),
                      )}
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
                    colSpan={10}
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
          Discounts recorded for these enrollments:{" "}
          <strong className="text-[#12372E]">
            {formatMoney(totalDiscounts)}
          </strong>
        </div>
      </section>

      {/* Payment records */}
      <section className="overflow-hidden rounded-2xl border border-[#DCE7E2] bg-white">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-bold text-[#12372E]">
            Payments Received
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Only money actually received during the selected period
            is included in the collected total.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
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
                  key={getId(payment._id)}
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
                    {formatMoney(Number(payment.amountPaid || 0))}
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
