import type { Metadata } from "next";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import StudentRegistrationForm from "@/components/dashboard/student/StudentRegistrationForm";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import ClassRecord from "@/models/Class";
export const metadata: Metadata = { title: "Register student" };
export default async function RegisterStudentPage() {
  await requireRole(["MANAGER"]);
  await connectDB();
  const [docs, classDocs] = await Promise.all([
    Course.find({ status: "ACTIVE" })
      .select("title fee duration")
      .sort({ title: 1 })
      .lean(),
    ClassRecord.find({ status: { $ne: "COMPLETED" } })
      .populate("course", "title")
      .populate("teacher", "name")
      .select("name course schedule teacher")
      .sort({ name: 1 })
      .lean(),
  ]);
  const courses = docs.map((c) => ({
    id: String(c._id),
    title: c.title,
    fee: c.fee,
    duration: c.duration,
  }));
  const classes = classDocs.map((c) => ({
    id: String(c._id),
    name: c.name,
    courseId: String(
      (c.course as unknown as { _id?: unknown } | null)?._id || c.course,
    ),
    courseTitle:
      (c.course as unknown as { title?: string } | null)?.title || "Course",
    schedule: c.schedule,
    teacherName:
      (c.teacher as unknown as { name?: string } | null)?.name ||
      "Not assigned",
  }));
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Students"
        title="Register student"
        description="Choose an active course from the academy catalogue, optionally assign a batch, create secure student credentials, and record any payment received."
      />
      <StudentRegistrationForm courses={courses} classes={classes} />
    </div>
  );
}
