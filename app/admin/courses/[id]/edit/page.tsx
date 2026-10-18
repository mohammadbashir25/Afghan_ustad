
import { notFound } from "next/navigation";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import CourseEditForm from "@/components/dashboard/catalog/CourseEditForm";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";

export const metadata = { title: "Edit Course | AfghanUstad" };

export default async function EditAdminCourse({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const { id } = await params;

  if (!/^[a-f\d]{24}$/i.test(id)) notFound();

  await connectDB();
  const doc = await Course.findById(id).lean();
  if (!doc) notFound();

  const course = {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    titleI18n: doc.titleI18n,
    categoryI18n: doc.categoryI18n,
    descriptionI18n: doc.descriptionI18n,
    durationI18n: doc.durationI18n,
    level: doc.level,
    fee: doc.fee,
    status: doc.status,
    featured: Boolean(doc.featured),
  } as const;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        eyebrow="Learning / Courses"
        title="Edit course"
        description="Update course details, translations, fee, thumbnail, and publication status."
      />
      <CourseEditForm
        course={course}
        basePath="/admin/courses"
      />
    </div>
  );
}
