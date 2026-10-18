
import { notFound } from "next/navigation";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import ClassEditForm from "@/components/dashboard/catalog/ClassEditForm";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import ClassRecord from "@/models/Class";
import Course from "@/models/Course";
import User from "@/models/User";

export const metadata = { title: "Edit Class | AfghanUstad" };

export default async function EditAdminClass({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const { id } = await params;

  if (!/^[a-f\d]{24}$/i.test(id)) notFound();

  await connectDB();

  const [doc, courseDocs, guideDocs, teacherDocs] = await Promise.all([
    ClassRecord.findById(id).lean(),
    Course.find().select("_id title status").sort({ title: 1 }).lean(),
    User.find({ role: "GUIDE", isActive: true }).select("_id name").sort({ name: 1 }).lean(),
    User.find({ role: "TEACHER", isActive: true }).select("_id name").sort({ name: 1 }).lean(),
  ]);

  if (!doc) notFound();

  const dateValue = (date: Date | null | undefined) =>
    date ? new Date(date).toISOString().slice(0, 10) : "";

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        eyebrow="Learning / Classes"
        title="Edit class"
        description="Update the course, assigned staff, schedule, dates, and class status."
      />
      <ClassEditForm
        basePath="/admin/classes"
        classData={{
          id: String(doc._id),
          name: doc.name,
          courseId: String(doc.course),
          guideId: doc.guide ? String(doc.guide) : "",
          teacherId: doc.teacher ? String(doc.teacher) : "",
          schedule: doc.schedule,
          startDate: dateValue(doc.startDate),
          endDate: dateValue(doc.endDate),
          status: doc.status,
        }}
        courses={courseDocs.map((c) => ({
          id: String(c._id),
          name: c.title + (c.status === "ARCHIVED" ? " (Archived)" : ""),
        }))}
        guides={guideDocs.map((u) => ({
          id: String(u._id),
          name: u.name,
        }))}
        teachers={teacherDocs.map((u) => ({
          id: String(u._id),
          name: u.name,
        }))}
      />
    </div>
  );
}
