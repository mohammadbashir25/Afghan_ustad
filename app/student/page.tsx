import Link from "next/link";
import { requireStudent } from "@/lib/student/session";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import Attendance from "@/models/Attendance";
import Performance from "@/models/Performance";
import MonthlyTest from "@/models/MonthlyTest";
import ClassRecord from "@/models/Class";
export const metadata = { title: "Student Dashboard | AfghanUstad" };
export default async function StudentDashboardPage() {
  const session = await requireStudent();
  await connectDB();
  const student = await User.findById(session.user.id)
    .select(
      "name fatherName studentId whatsappNumber photoUrl course class courseName courseFee",
    )
    .lean();
  if (!student)
    return (
      <div className="rounded-xl border bg-white p-6">
        Dashboard unavailable. Please contact the manager.
      </div>
    );
  const activeEnrollments = await Enrollment.find({
    student: student._id,
    status: "ACTIVE",
  })
    .select("class")
    .lean();
  const activeClassIds = [
    ...new Set([
      ...activeEnrollments.map((e) => String(e.class || "")).filter(Boolean),
      ...(activeEnrollments.length
        ? []
        : student.class
          ? [String(student.class)]
          : []),
    ]),
  ];
  const [enrollments, attendance, marks, tests] = await Promise.all([
    Enrollment.find({ student: student._id, status: { $ne: "CANCELLED" } })
      .populate("course", "title")
      .populate({
        path: "class",
        select: "name schedule status guide teacher",
        populate: [
          { path: "guide", select: "name" },
          { path: "teacher", select: "name" },
        ],
      })
      .sort({ enrolledAt: -1 })
      .lean(),
    Attendance.find({ student: student._id }).select("status").lean(),
    Performance.find({ student: student._id })
      .select("score maxScore notes assessment date")
      .sort({ date: -1 })
      .limit(10)
      .lean(),
    MonthlyTest.find({ status: "OPEN", class: { $in: activeClassIds } })
      .select("_id title testDate")
      .lean(),
  ]);
  const attendanceRate = attendance.length
    ? Math.round(
        (attendance.filter((a) => ["PRESENT", "LATE"].includes(a.status))
          .length /
          attendance.length) *
          100,
      )
    : null;
  const average = marks.length
    ? Math.round(
        marks.reduce(
          (s, m) => s + (m.score / Math.max(1, m.maxScore)) * 100,
          0,
        ) / marks.length,
      )
    : null;
  const legacyClass = student.class
    ? await ClassRecord.findById(student.class).populate("guide", "name").lean()
    : null;
  const cards = [
    {
      href: "/student/monthly-tests",
      label: "Monthly Test",
      value: String(tests.length),
      detail: "Take your available monthly test",
    },
    {
      href: "/student/marks",
      label: "Results & Feedback",
      value: average === null ? "—" : `${average}%`,
      detail: "Marks, KPI-related results, and feedback",
    },
    {
      href: "/student/attendance",
      label: "Attendance",
      value: attendanceRate === null ? "—" : `${attendanceRate}%`,
      detail: "Your recorded class attendance",
    },
    {
      href: "/student/leaderboard",
      label: "Leaderboard",
      value: "View rank",
      detail: "See your position and progress",
    },
    {
      href: "/student/payments",
      label: "Fee & Balance",
      value: "View account",
      detail: "Payments, fees, and receipts",
    },
    {
      href: "/student/profile",
      label: "My Profile",
      value: student.studentId || "Student ID",
      detail: "Personal details and account settings",
    },
  ];
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-[#053B2E] p-6 text-white sm:p-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/40 bg-white/10">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={`${student.name} profile`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold">
                {student.name?.slice(0, 1)?.toUpperCase() || "S"}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">
              AFGHANUSTAD · STUDENT PORTAL
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Welcome back, {student.name}
            </h1>
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
          Your Skill Center guide records ongoing task performance, KPI,
          attendance, and feedback. Use your dashboard to review your progress
          and take the monthly test when it becomes available.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/student/monthly-tests"
            className="rounded-lg bg-[#F4C430] px-4 py-2.5 text-sm font-bold text-[#053B2E]"
          >
            Open monthly test
          </Link>
          <Link
            href="/student/marks"
            className="rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white"
          >
            View results
          </Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-[#DCE7E2] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#0B6B4F] hover:shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className="mt-2 break-words text-xl font-bold text-[#053B2E]">
              {c.value}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{c.detail}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-[#0B6B4F]">
              Open page →
            </span>
          </Link>
        ))}
      </section>
      <section className="rounded-xl border border-[#DCE7E2] bg-white p-5">
        <h2 className="text-lg font-bold text-[#053B2E]">
          My enrolled classes
        </h2>
        <div className="mt-3 divide-y divide-[#E7EEEA]">
          {enrollments.map((e) => {
            const course = e.course as unknown as { title?: string } | null;
            const cls = e.class as unknown as {
              name?: string;
              schedule?: string;
              status?: string;
              guide?: { name?: string } | string | null;
              teacher?: { name?: string } | string | null;
            } | null;
            return (
              <article key={String(e._id)} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#12372E]">
                      {cls?.name || e.courseName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {course?.title || e.courseName} ·{" "}
                      {cls?.schedule || "Schedule not set"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Teacher:{" "}
                      {typeof cls?.teacher === "object"
                        ? cls.teacher?.name || "Not assigned"
                        : "Not assigned"}{" "}
                      · Guide:{" "}
                      {typeof cls?.guide === "object"
                        ? cls.guide?.name || "Not assigned"
                        : "Not assigned"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${e.status === "ACTIVE" ? "bg-[#E6F4EE] text-[#053B2E]" : "bg-amber-100 text-amber-900"}`}
                  >
                    {e.status}
                  </span>
                </div>
              </article>
            );
          })}
          {!enrollments.length && (
            <p className="py-4 text-sm text-slate-500">
              Your enrolled classes will appear here after the manager registers
              you.
            </p>
          )}
          {legacyClass && !enrollments.length && (
            <article className="py-3">
              <p className="font-semibold">{legacyClass.name}</p>
              <p className="text-sm text-slate-500">Legacy class record</p>
            </article>
          )}
        </div>
      </section>
      <section className="rounded-xl border border-[#DCE7E2] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-[#053B2E]">
            Recent results and guide feedback
          </h2>
          <Link
            href="/student/marks"
            className="text-sm font-semibold text-[#0B6B4F]"
          >
            View all →
          </Link>
        </div>
        <div className="mt-3 divide-y divide-[#E7EEEA]">
          {marks.slice(0, 4).map((m) => (
            <article key={String(m._id)} className="py-3">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium">{m.assessment}</p>
                <p className="font-semibold text-[#0B6B4F]">
                  {m.score}/{m.maxScore}
                </p>
              </div>
              {m.notes && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">
                  {m.notes}
                </p>
              )}
            </article>
          ))}
          {!marks.length && (
            <p className="py-4 text-sm text-slate-500">
              Your guide&apos;s task results and feedback will appear here when
              recorded.
            </p>
          )}
        </div>
      </section>
      <p className="text-xs text-slate-500">
        Student ID: {student.studentId || "—"} · Father&apos;s name:{" "}
        {student.fatherName || "—"} · WhatsApp: {student.whatsappNumber || "—"}
      </p>
    </div>
  );
}
