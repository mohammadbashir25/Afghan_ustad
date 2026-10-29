import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ClassRecord from "@/models/Class";
import StudentEditForm from "@/components/dashboard/users/StudentEditForm";

export const metadata = {
  title: "Edit Student | AfghanUstad",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["SUPER_ADMIN"]);

  const { id } = await params;

  await connectDB();

  const s = await User.findOne({
    _id: id,
    role: "STUDENT",
  })
    .select("name fatherName whatsappNumber")
    .lean();

  if (!s) notFound();

  const classRecords = await ClassRecord.find({
    status: { $ne: "COMPLETED" },
  })
    .select("_id name schedule teacher course")
    .populate("teacher", "name")
    .populate("course", "title")
    .sort({ name: 1 })
    .lean();

  const classes = classRecords.map((item) => ({
    id: String(item._id),
    name: item.name,
    schedule: item.schedule,
    teacherName:
      item.teacher && typeof item.teacher === "object" && "name" in item.teacher
        ? String(item.teacher.name ?? "Not assigned")
        : "Not assigned",
    courseId:
      item.course && typeof item.course === "object" && "_id" in item.course
        ? String(item.course._id)
        : "",
    courseTitle:
      item.course && typeof item.course === "object" && "title" in item.course
        ? String(item.course.title ?? "")
        : "",
  }));

  return (
    <div className="space-y-5">
      <Link
        href="/admin/students"
        className="text-sm font-semibold text-[#0B6B4F]"
      >
        ← Students
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-[#053B2E]">Edit student</h2>
        <p className="mt-1 text-sm text-slate-500">
          Update the student&apos;s personal and contact details.
        </p>
      </div>

      <StudentEditForm
        returnTo="/admin/students"
        student={{
          id: String(s._id),
          name: s.name,
          fatherName: s.fatherName || "",
          whatsappNumber: s.whatsappNumber || "",
        }}
        classes={classes}
      />
    </div>
  );
}
