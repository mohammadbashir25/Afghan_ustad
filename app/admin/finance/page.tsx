import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import User from "@/models/User";
import ClassRecord from "@/models/Class";
import Enrollment from "@/models/Enrollment";
import Expense from "@/models/Expense";
import StaffAdjustment from "@/models/StaffAdjustment";
import ResourcePage from "@/components/dashboard/ResourcePage";
import MonthlyFinanceChart from "@/components/dashboard/charts/MonthlyFinanceChart";
import { getMonthlyFinanceSeries } from "@/lib/finance/monthly";
import Course from "@/models/Course";

export const metadata = { title: "Finance & Payments | AfghanUstad" };

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
  await requireRole(["SUPER_ADMIN"]);
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
    enrollments,
    legacyStudents,
    expenses,
    staffAdjustments,
    monthlyFinance,
    registrationCount,
    enrollmentCount,
  ] = await Promise.all([
    ClassRecord.find()
      .populate("course", "title")
      .select("name course")
      .sort({ name: 1 })
      .lean(),
    Payment.find({
      ...(classId ? { class: classId } : {}),
      ...(hasDateFilter ? { paidAt: dateFilter } : {}),
    })
      .populate("student", "name studentId")
      .sort({ paidAt: -1 })
      .limit(1000)
      .lean(),
    // Keep the complete payment history for accurate outstanding balances.
    Payment.find(classId ? { class: classId } : {})
      .select("enrollment student amountPaid")
      .lean(),
    // Keep all active/non-cancelled enrollments for cumulative fees and balances.
    Enrollment.find({
      status: { $ne: "CANCELLED" },
      ...(classId ? { class: classId } : {}),
    })
      .populate("student", "name studentId")
      .sort({ enrolledAt: -1 })
      .limit(2000)
      .lean(),
    User.find({ role: "STUDENT" })
      .select(
        "_id name studentId courseName courseFee discountAmount class isActive",
      )
      .lean(),
    Expense.find({
      status: { $in: ["RECORDED", "APPROVED"] },
      ...(hasDateFilter ? { date: dateFilter } : {}),
    })
      .select("amount date")
      .lean(),
    StaffAdjustment.find({
      status: "POSTED",
      ...(hasDateFilter ? { effectiveAt: dateFilter } : {}),
    })
      .select("type amount")
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

  const selectedStudentIds = new Set(
    enrollments.map((e) =>
      String((e.student as unknown as { _id?: unknown } | null)?._id),
    ),
  );
  const legacy = legacyStudents.filter(
    (s) =>
      !selectedStudentIds.has(String(s._id)) &&
      (!classId || String(s.class || "") === classId),
  );

  const fees =
    enrollments.reduce((sum, e) => sum + e.courseFee, 0) +
    legacy.reduce((sum, s) => sum + (s.courseFee || 0), 0);
  const discounts =
    enrollments.reduce((sum, e) => sum + (e.discountAmount || 0), 0) +
    legacy.reduce((sum, s) => sum + (s.discountAmount || 0), 0);
  const collected = payments.reduce((sum, p) => sum + p.amountPaid, 0);

  const paidByEnrollment = new Map<string, number>();
  const paidByStudent = new Map<string, number>();
  for (const p of paymentHistory) {
    if (p.enrollment) {
      paidByEnrollment.set(
        String(p.enrollment),
        (paidByEnrollment.get(String(p.enrollment)) || 0) + p.amountPaid,
      );
    } else {
      paidByStudent.set(
        String(p.student),
        (paidByStudent.get(String(p.student)) || 0) + p.amountPaid,
      );
    }
  }
  void paidByStudent;

  const outstandingRows = enrollments
    .filter((e) => e.courseFee - (paidByEnrollment.get(String(e._id)) || 0) > 0)
    .map((e) => {
      const st = e.student as unknown as {
        name?: string;
        studentId?: string;
      } | null;
      const due = e.courseFee - (paidByEnrollment.get(String(e._id)) || 0);
      return {
        title: st?.name || "Student",
        detail: `${e.courseName} · ${st?.studentId || "No student ID"} · discount ${e.discountAmount || 0} AFN`,
        status: `${due.toLocaleString()} AFN due`,
        meta: e.status,
      };
    });

  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const staffNet = staffAdjustments.reduce(
    (sum, a) => sum + (a.type === "GIFT" ? a.amount : -a.amount),
    0,
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-[#053B2E]">
          Finance & Payments
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Organization-wide financial overview. Fees, discounts, and balances
          are tracked per enrollment so one student&apos;s next course does not
          overwrite previous course records.
        </p>
      </header>

      <form
        action="/admin/finance"
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
          href="/admin/finance/payments/new"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#0B6B4F]"
        >
          Record payment
        </Link>
        <Link
          href="/admin/finance/expenses"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#0B6B4F]"
        >
          Manage expenses
        </Link>
        <Link
          href="/admin/staff-adjustments"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#0B6B4F]"
        >
          Staff account adjustments
        </Link>
      </form>

      <MonthlyFinanceChart data={monthlyFinance} />

      <ResourcePage
        eyebrow="Finance"
        title={
          classId
            ? `Class finance · ${classes.find((c) => String(c._id) === classId)?.name || "Selected class"}`
            : "Financial overview"
        }
        description={`Amounts are in AFN. Net cash movement is collected payments minus recorded operating expenses; staff fines/gifts are tracked separately in the staff ledger.${hasDateFilter ? ` Period: ${startDate || "earliest"} to ${endDate || "latest"}.` : ""}`}
        stats={[
          { label: "Payment records", value: payments.length },
          {
            label: "Collected fees",
            value: `${collected.toLocaleString()} AFN`,
          },
          {
            label: "Students registered in period",
            value: registrationCount.toLocaleString(),
          },
          {
            label: "Enrollments in period",
            value: enrollmentCount.toLocaleString(),
          },
          {
            label: "Fees after discounts",
            value: `${fees.toLocaleString()} AFN`,
          },
          {
            label: "Discounts applied",
            value: `${discounts.toLocaleString()} AFN`,
          },
          {
            label: "Outstanding balance (estimate)",
            value: `${Math.max(0, fees - collected).toLocaleString()} AFN`,
          },
          {
            label: "Operating expenses",
            value: `${expenseTotal.toLocaleString()} AFN`,
          },
          {
            label: "Cash after expenses",
            value: `${(collected - expenseTotal).toLocaleString()} AFN`,
          },
          {
            label: "Net staff adjustments",
            value: `${staffNet.toLocaleString()} AFN`,
          },
        ]}
        rows={payments.map((p) => ({
          title: `${(p.student as unknown as { name?: string } | null)?.name || p.studentName || "Student"} · ${p.amountPaid.toLocaleString()} AFN`,
          detail: `${p.courseName} · Receipt ${p.receiptNumber} · balance after payment ${p.balanceAfterPayment.toLocaleString()} AFN`,
          status: p.method,
          meta: new Date(p.paidAt).toLocaleDateString("en-GB"),
        }))}
        empty="No payments match this view."
      />

      <section className="rounded-xl border border-[#DCE7E2] bg-white p-5">
        <h2 className="font-semibold text-[#053B2E]">
          Outstanding student balances
        </h2>
        <div className="mt-3 space-y-2">
          {outstandingRows.map((r, i) => (
            <div
              key={`${r.title}-${i}`}
              className="flex flex-wrap items-start justify-between gap-3 border-b py-3"
            >
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="mt-1 text-sm text-slate-500">{r.detail}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-amber-800">{r.status}</p>
                <p className="text-xs text-slate-500">{r.meta}</p>
              </div>
            </div>
          ))}
          {!outstandingRows.length && (
            <p className="text-sm text-slate-500">
              No outstanding enrollment balances in this view.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
