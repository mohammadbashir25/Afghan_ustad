import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ClassRecord from "@/models/Class";
import StudentEditForm from "@/components/dashboard/users/StudentEditForm";
export const metadata = { title: "Edit Student | AfghanUstad" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["MANAGER"]);
  const { id } = await params;
  await connectDB();
  const [s, classDocs] = await Promise.all([
    User.findOne({ _id: id, role: "STUDENT" })
      .select("name fatherName whatsappNumber class course")
      .lean(),
    ClassRecord.find({ status: { $ne: "COMPLETED" } })
      .populate("course", "title")
      .populate("teacher", "name")
      .select("name course schedule teacher")
      .sort({ name: 1 })
      .lean(),
  ]);
  if (!s) notFound();
  const classes = classDocs.map((c) => ({
    id: String(c._id),
    name: c.name,
    schedule: c.schedule,
    courseId: String(
      (c.course as unknown as { _id?: unknown } | null)?._id || c.course,
    ),
    courseTitle:
      (c.course as unknown as { title?: string } | null)?.title || "Course",
    teacherName:
      (c.teacher as unknown as { name?: string } | null)?.name ||
      "Not assigned",
  }));
  return (
    <div className="space-y-5">
      <Link
        href="/manager/students"
        className="text-sm font-semibold text-[#0B6B4F]"
      >
        ← Students
      </Link>
      <div>
        <h2 className="text-2xl font-bold text-[#053B2E]">Edit student</h2>
        <p className="mt-1 text-sm text-slate-500">
          Update personal details and move the student to an active class.
          Attendance and historical records are retained.
        </p>
      </div>
      <StudentEditForm
        returnTo="/manager/students"
        student={{
          id: String(s._id),
          name: s.name,
          fatherName: s.fatherName || "",
          whatsappNumber: s.whatsappNumber || "",
          classId: s.class ? String(s.class) : "",
          courseId: s.course ? String(s.course) : "",
        }}
        classes={classes}
      />
    </div>
  );
}
