import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ClassRecord from "@/models/Class";
import StaffAttendance from "@/models/StaffAttendance";
import StaffPerformance from "@/models/StaffPerformance";
import StaffAdjustment from "@/models/StaffAdjustment";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "Staff Management | AfghanUstad" };
export default async function Page() {
  await requireRole(["MANAGER"]);
  await connectDB();
  const staff = await User.find({
    role: { $in: ["MANAGER", "GUIDE", "TEACHER", "STAFF"] },
  })
    .select("name role email isActive salaryAmount")
    .sort({ name: 1 })
    .lean();
  const rows = await Promise.all(
    staff.map(async (person) => {
      const [guideClasses, teacherClasses, attendance, kpiRecords, adjustments] =
        await Promise.all([
          ClassRecord.countDocuments({ guide: person._id }),
          ClassRecord.countDocuments({ teacher: person._id }),
          StaffAttendance.countDocuments({ staff: person._id }),
          StaffPerformance.find({ staff: person._id }).select("score").lean(),
          StaffAdjustment.find({ staff: person._id, status: "POSTED" })
            .select("type amount")
            .lean(),
        ]);
      const net = adjustments.reduce(
        (sum, a) => sum + (a.type === "GIFT" ? a.amount : -a.amount),
        0,
      );
      return {
        title: person.name,
        detail: `${person.role} · ${guideClasses + teacherClasses} assigned classes · ${attendance} staff attendance records · ${kpiRecords.length} KPI records`,
        status: person.isActive ? "Active" : "Inactive",
        meta: `Base salary ${Number(person.salaryAmount || 0).toLocaleString()} AFN · adjustments ${net.toLocaleString()} AFN · average KPI ${kpiRecords.length ? Math.round(kpiRecords.reduce((n, x) => n + x.score, 0) / kpiRecords.length) : "—"}`,
      };
    }),
  );
  return (
    <div className="space-y-5">
      <ResourcePage
        eyebrow="People"
        title="Staff Management"
        description="Review teachers, Skill Center guides, managers, and other staff, including assigned classes, daily attendance, KPI evaluations, and net fines/gifts."
        stats={[
          { label: "Staff accounts", value: staff.length },
          {
            label: "Active staff",
            value: staff.filter((x) => x.isActive).length,
          },
          {
            label: "Teachers",
            value: staff.filter((x) => x.role === "TEACHER").length,
          },
          {
            label: "Skill Center guides",
            value: staff.filter((x) => x.role === "GUIDE").length,
          },
        ]}
        rows={rows}
        empty="No staff accounts have been created yet."
      />
      <div className="flex flex-wrap gap-3">
        <Link
          href="/manager/staff-attendance"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#0B6B4F]"
        >
          Daily staff attendance
        </Link>
        <Link
          href="/manager/staff-performance"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#0B6B4F]"
        >
          Staff KPI
        </Link>
        <Link
          href="/manager/staff-adjustments"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#0B6B4F]"
        >
          Fines & gifts
        </Link>
      </div>
    </div>
  );
}
