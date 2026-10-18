/* Mongoose populate() result types are dynamic in this project; narrow populated fields at the rendering boundary. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Performance from "@/models/Performance";
import ClassRecord from "@/models/Class";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "KPI Evaluations | AfghanUstad" };
export default async function Page() {
  const s = await requireRole(["GUIDE"]);
  await connectDB();
  const classes = await ClassRecord.find({ guide: s.user.id })
    .select("_id course")
    .lean();
  const ids = classes.map((c) => c._id);
  const p = await Performance.find({ class: { $in: ids } })
    .populate("student", "name studentId")
    .populate("course", "title")
    .sort({ date: -1 })
    .limit(100)
    .lean();
  return (
    <ResourcePage
      eyebrow="Teaching"
      title="KPI Evaluations"
      description="Review skill evaluations for students in your assigned classes."
      stats={[{ label: "Recorded evaluations", value: p.length }]}
      actions={[{ href: "/guide/kpa/new", label: "Record evaluation" }]}
      rows={p.map((x) => ({
        title: `${(x.student as any)?.name || "Student"} · ${x.assessment}`,
        detail: (x.course as any)?.title || "Course",
        status: `${Math.round((x.score / x.maxScore) * 100)}%`,
        meta: `${x.score}/${x.maxScore}`,
      }))}
    />
  );
}
