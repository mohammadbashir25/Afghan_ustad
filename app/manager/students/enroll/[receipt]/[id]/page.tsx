import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Enrollment from "@/models/Enrollment";
import Payment from "@/models/Payment";
import PrintPageButton from "@/components/dashboard/student/PrintPageButton";

export const metadata = { title: "Enrollment Receipt | AfghanUstad" };
const afn = (n: number) =>
  `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} AFN`;
export default async function EnrollmentReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["MANAGER"]);
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  await connectDB();
  const enrollment = await Enrollment.findById(id)
    .populate("student", "name studentId username")
    .populate("class", "name schedule teacher")
    .populate({ path: "class", populate: { path: "teacher", select: "name" } })
    .lean();
  if (!enrollment) notFound();
  const student = enrollment.student as unknown as {
    name?: string;
    studentId?: string;
    username?: string;
  } | null;
  const cls = enrollment.class as unknown as {
    name?: string;
    schedule?: string;
    teacher?: { name?: string } | null;
  } | null;
  const paymentTotals = await Payment.aggregate([
    { $match: { enrollment: enrollment._id } },
    { $group: { _id: null, totalPaid: { $sum: "$amountPaid" } } },
  ]);
  const paid = Number(paymentTotals[0]?.totalPaid || 0);
  const balance = Math.max(0, enrollment.courseFee - paid);
  return (
    <main className="mx-auto max-w-xl space-y-4 p-5">
      <div className="print:hidden flex items-center justify-between">
        <Link
          href="/manager/students/enroll"
          className="text-sm font-semibold text-[#0B6B4F]"
        >
          ← Back to enrollment
        </Link>
        <PrintPageButton />
      </div>
      <article className="receipt rounded-xl border border-slate-300 bg-white p-6 text-slate-900">
        <header className="text-center">
          <h1 className="text-2xl font-extrabold tracking-wide">AFGHANUSTAD</h1>
          <p className="mt-1 text-sm">STUDENT ENROLLMENT BILL</p>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(
              enrollment.enrolledAt || enrollment.createdAt,
            ).toLocaleString("en-GB")}
          </p>
        </header>
        <hr className="my-4" />
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Student</dt>
            <dd className="font-semibold">{student?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Student ID</dt>
            <dd className="font-semibold">{student?.studentId || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Username</dt>
            <dd className="font-semibold">{student?.username || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">PIN</dt>
            <dd className="font-mono text-lg font-bold">
              {enrollment.enrollmentPin || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Course</dt>
            <dd className="font-semibold">{enrollment.courseName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Class</dt>
            <dd className="font-semibold">{cls?.name || "Not assigned"}</dd>
            <p className="text-xs text-slate-500">
              {cls?.schedule || ""}
              {cls?.teacher?.name ? ` · ${cls.teacher.name}` : ""}
            </p>
          </div>
        </dl>
        <hr className="my-4" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Course fee</span>
            <strong>{afn(enrollment.courseFee)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Paid</span>
            <strong>{afn(paid)}</strong>
          </div>
          <div className="flex justify-between border-t pt-2 text-base">
            <span>Balance</span>
            <strong>{afn(balance)}</strong>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Please keep this bill for your records.
        </p>
      </article>
    </main>
  );
}
