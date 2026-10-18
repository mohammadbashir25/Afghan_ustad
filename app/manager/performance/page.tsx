/* Mongoose populate() result types are dynamic in this project; narrow populated fields at the rendering boundary. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Performance from "@/models/Performance";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "Evaluations & KPI | AfghanUstad" };
export default async function Page() {
  await requireRole(["MANAGER"]);
  await connectDB();
  const rows = await Performance.find()
    .populate("student", "name studentId")
    .populate("course", "title")
    .sort({ date: -1 })
    .limit(100)
    .lean();
  return (
    <ResourcePage
      eyebrow="Learning"
      title="Evaluations & KPI"
      description="Monitor student assessments and recorded skill progress."
      stats={[
        {
          label: "Assessments recorded",
          value: await Performance.countDocuments(),
        },
      ]}
      actions={[
        { href: "/manager/performance/new", label: "Record evaluation" },
      ]}
      rows={rows.map((p) => ({
        title: `${(p.student as any)?.name || "Student"} · ${p.assessment}`,
        detail: (p.course as any)?.title || "Course",
        status: `${Math.round((p.score / p.maxScore) * 100)}%`,
        meta: `${p.score}/${p.maxScore} · ${new Date(p.date).toLocaleDateString("en-GB")}`,
      }))}
    />
  );
}
