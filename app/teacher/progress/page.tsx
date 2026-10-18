import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import Performance from "@/models/Performance";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "Student Progress & KPI | AfghanUstad" };
export default async function Page() {
  const s = await requireRole(["TEACHER"]);
  await connectDB();
  const classes = await ClassRecord.find({ teacher: s.user.id })
    .select("_id name")
    .lean();
  const rows = await Performance.find({
    class: { $in: classes.map((c) => c._id) },
  })
    .populate("student", "name studentId")
    .populate("class", "name")
    .sort({ date: -1 })
    .limit(500)
    .lean();
  return (
    <ResourcePage
      eyebrow="Teaching"
      title="Student Progress & KPI"
      description="Review student practical/task evaluations recorded by the Skill Center guide, including individual notes and feedback."
      stats={[
        { label: "Recorded evaluations", value: rows.length },
        {
          label: "Students evaluated",
          value: new Set(
            rows.map((r) =>
              String((r.student as unknown as { _id?: unknown } | null)?._id),
            ),
          ).size,
        },
      ]}
      rows={rows.map((r) => ({
        title: `${(r.student as unknown as { name?: string } | null)?.name || "Student"} · ${r.assessment}`,
        detail: `${r.notes || "No feedback recorded"} · ${(r.class as unknown as { name?: string } | null)?.name || "Class"}`,
        status: `${r.score}/${r.maxScore} (${Math.round((r.score / r.maxScore) * 100)}%)`,
        meta: new Date(r.date).toLocaleDateString("en-GB"),
      }))}
      empty="Student progress will appear after guides record evaluations."
    />
  );
}
