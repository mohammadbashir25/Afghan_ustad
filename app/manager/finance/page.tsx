import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import User from "@/models/User";
import ClassRecord from "@/models/Class";
import Enrollment from "@/models/Enrollment";
import Expense from "@/models/Expense";
import ResourcePage from "@/components/dashboard/ResourcePage";
import MonthlyFinanceChart from "@/components/dashboard/charts/MonthlyFinanceChart";
import { getMonthlyFinanceSeries } from "@/lib/finance/monthly";
import Course from "@/models/Course";

export const metadata = { title: "Finance | AfghanUstad" };

function getDateRange(start?: string, end?: string) {
  const validDate = (value?: string) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
      ? value
      : "";
  };

  const startDate = validDate(start);
  const endDate = validDate(end);
  if (startDate && endDate && startDate > endDate) {
    return { startDate: "", endDate: "" };
  }
  return { startDate, endDate };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    classId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  await requireRole(["MANAGER"]);
  await connectDB();
  void Course;

  const params = await searchParams;
  const classId =
    params.classId && /^[a-f\d]{24}$/i.test(params.classId)
      ? params.classId
      : "";
  const { startDate, endDate } = getDateRange(params.startDate, params.endDate);
  const dateFilter: { $gte?: Date; $lt?: Date } = {};

  if (startDate) dateFilter.$gte = new Date(`${startDate}T00:00:00.000Z`);
  if (endDate) {
    const endExclusive = new Date(`${endDate}T00:00:00.000Z`);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    dateFilter.$lt = endExclusive;
  }

  const hasDateFilter = Boolean(startDate || endDate);

  const [
    classes,
    payments,
    paymentHistory,
    students,
    enrollments,
    expenses,
    monthlyFinance,
    registrationCount,
    enrollmentCount,
  ] = await Promise.all([
    ClassRecord.find()
      .populate("course", "title")
      .sort({ name: 1 })
      .select("name course")
      .lean(),
    Payment.find({
      ...(classId ? { class: classId } : {}),
      ...(hasDateFilter ? { paidAt: dateFilter } : {}),
    })
      .populate("student", "name studentId")
      .sort({ paidAt: -1 })
      .limit(500)
      .lean(),
    // Keep the complete payment history for accurate outstanding balances.
    Payment.find(classId ? { class: classId } : {})
      .select("enrollment student amountPaid")
      .lean(),
    User.find({ role: "STUDENT" })
      .select(
        "_id name studentId courseFee discountAmount isActive course class courseName",
      )
      .lean(),
    // Keep all non-cancelled enrollments for cumulative fees and balances.
    Enrollment.find({
      status: { $ne: "CANCELLED" },
      ...(classId ? { class: classId } : {}),
    })
      .populate("student", "name studentId")
      .select("student courseFee discountAmount status class courseName")
      .lean(),
    Expense.find({
      status: { $in: ["RECORDED", "APPROVED"] },
      ...(hasDateFilter ? { date: dateFilter } : {}),
    })
      .select("amount status date")
      .lean(),
    getMonthlyFinanceSeries(classId || undefined),
    User.countDocuments({
      role: "STUDENT",
      ...(hasDateFilter ? { registrationDate: dateFilter } : {}),
    }),
    Enrollment.countDocuments({
      status: { $ne: "CANCELLED" },
      ...(classId ? { class: classId } : {}),
      ...(hasDateFilter ? { enrolledAt: dateFilter } : {}),
    }),
  ]);

  const enrollmentStudentIds = new Set(
    enrollments.map((e) =>
      String(
        (e.student as unknown as { _id?: unknown } | null)?._id || e.student,
      ),
    ),
  );
  const eligibleStudents = classId
    ? students.filter(
        (s) =>
          String(s.class || "") === classId ||
          enrollmentStudentIds.has(String(s._id)),
      )
    : students;
  const paid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const enrollmentFees =
    enrollments.reduce((sum, e) => sum + Math.max(0, e.courseFee), 0) +
    eligibleStudents
      .filter((u) => !enrollmentStudentIds.has(String(u._id)))
      .reduce((sum, u) => sum + (u.courseFee || 0), 0);
  const discountTotal =
    enrollments.reduce((sum, e) => sum + (e.discountAmount || 0), 0) +
    eligibleStudents
      .filter((u) => !enrollmentStudentIds.has(String(u._id)))
      .reduce((sum, u) => sum + (u.discountAmount || 0), 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const paidByEnrollment = new Map<string, number>();
  for (const payment of paymentHistory) {
    if (payment.enrollment) {
      paidByEnrollment.set(
        String(payment.enrollment),
        (paidByEnrollment.get(String(payment.enrollment)) || 0) +
          payment.amountPaid,
      );
    }
  }

  const outstandingEnrollments = enrollments.filter(
    (e) => e.courseFee - (paidByEnrollment.get(String(e._id)) || 0) > 0,
  );
  const selectedClass = classes.find((c) => String(c._id) === classId);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-[#053B2E]">Finance</h1>
        <p className="mt-2 text-sm text-slate-500">
          Review class-level fees, discounts, collected payments, outstanding
          balances, and expenses. Balances are tracked per enrollment so a
          student&apos;s next course does not overwrite previous course records.
        </p>
      </header>

      <form
        action="/manager/finance"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-[#DCE7E2] bg-white p-4"
      >
        <label className="min-w-60 flex-1 text-sm font-medium">
          Filter by class
          <select
            name="classId"
            defaultValue={classId}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={String(c._id)} value={String(c._id)}>
                {c.name} ·{" "}
                {(c.course as unknown as { title?: string } | null)?.title ||
                  "Course"}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-40 flex-1 text-sm font-medium">
          Start date
          <input
            type="date"
            name="startDate"
            defaultValue={startDate}
            max={endDate || undefined}
            className="mt-1 w-full rounded-lg border border-[#DCE7E2] px-3 py-2 text-sm"
          />
        </label>
        <label className="min-w-40 flex-1 text-sm font-medium">
          End date
          <input
            type="date"
            name="endDate"
            defaultValue={endDate}
            min={startDate || undefined}
            className="mt-1 w-full rounded-lg border border-[#DCE7E2] px-3 py-2 text-sm"
          />
        </label>
        <button className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">
          Apply filter
        </button>
        <Link
          href="/manager/finance/payments/new"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#0B6B4F]"
        >
          Record payment
        </Link>
        <Link
          href="/manager/students/enroll"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#0B6B4F]"
        >
          Enroll existing student
        </Link>
      </form>

      <MonthlyFinanceChart data={monthlyFinance} />

      <ResourcePage
        eyebrow="Operations"
        title={
          classId
            ? `Finance · ${selectedClass?.name || "Selected class"}`
            : "Finance overview"
        }
        description={`Amounts are in AFN. Outstanding figures are calculated from each enrollment's full payment history.${hasDateFilter ? ` Period: ${startDate || "earliest"} to ${endDate || "latest"}.` : ""}`}
        stats={[
          { label: "Payment records", value: payments.length },
          { label: "Collected", value: `${paid.toLocaleString()} AFN` },
          {
            label: "Students registered in period",
            value: registrationCount.toLocaleString(),
          },
          {
            label: "Enrollments in period",
            value: enrollmentCount.toLocaleString(),
          },
          {
            label: "Enrolled fees",
            value: `${enrollmentFees.toLocaleString()} AFN`,
          },
          {
            label: "Discounts applied",
            value: `${discountTotal.toLocaleString()} AFN`,
          },
          {
            label: "Outstanding estimate",
            value: `${Math.max(0, enrollmentFees - paid).toLocaleString()} AFN`,
          },
          {
            label: "Recorded expenses",
            value: `${expenseTotal.toLocaleString()} AFN`,
          },
        ]}
        rows={payments.map((p) => ({
          title: `${(p.student as unknown as { name?: string } | null)?.name || p.studentName || "Student"} · ${p.amountPaid.toLocaleString()} AFN`,
          detail: `${p.courseName} · ${p.receiptNumber} · balance after payment ${p.balanceAfterPayment.toLocaleString()} AFN`,
          status: p.method,
          meta: new Date(p.paidAt).toLocaleDateString("en-GB"),
        }))}
        empty="No payment records match this filter."
      />

      <section className="rounded-xl border border-[#DCE7E2] bg-white p-5">
        <h2 className="font-semibold text-[#053B2E]">
          Outstanding enrollment balances
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="p-2">Student</th>
                <th className="p-2">Student ID</th>
                <th className="p-2">Course</th>
                <th className="p-2">Balance due</th>
                <th className="p-2">Enrollment status</th>
              </tr>
            </thead>
            <tbody>
              {outstandingEnrollments.map((e) => {
                const student = e.student as unknown as {
                  name?: string;
                  studentId?: string;
                } | null;
                const due = Math.max(
                  0,
                  e.courseFee - (paidByEnrollment.get(String(e._id)) || 0),
                );
                return (
                  <tr key={String(e._id)} className="border-b">
                    <td className="p-2 font-medium">
                      {student?.name || "Student"}
                    </td>
                    <td className="p-2">{student?.studentId || "—"}</td>
                    <td className="p-2">{e.courseName}</td>
                    <td className="p-2 font-semibold text-amber-800">
                      {due.toLocaleString()} AFN
                    </td>
                    <td className="p-2">{e.status}</td>
                  </tr>
                );
              })}
              {!outstandingEnrollments.length && (
                <tr>
                  <td colSpan={5} className="p-3 text-slate-500">
                    No outstanding enrollment balances in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
