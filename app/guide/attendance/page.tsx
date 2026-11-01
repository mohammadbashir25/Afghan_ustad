import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";

import ClassRecord from "@/models/Class";
import Course from "@/models/Course";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import Attendance from "@/models/Attendance";

import ClassAttendanceForm from "@/components/dashboard/attendance/ClassAttendanceForm";

// ---------------------------------------------
// Types
// ---------------------------------------------

type PageProps = {
  searchParams: Promise<{
    date?: string;
    saved?: string;
    error?: string;
  }>;
};

type PopulatedCourse = {
  _id?: unknown;
  title?: string;
} | null;

type ClassRecordData = {
  _id: unknown;
  name?: string;
  title?: string;
  course: unknown;
  schedule?: unknown;
};

type EnrollmentData = {
  student: unknown;
};

type StudentData = {
  _id: unknown;
  name?: string;
  studentId?: string;
};

type AttendanceData = {
  student: unknown;
  status: string;
};

type Student = {
  id: string;
  name: string;
  studentId: string;
};

// ---------------------------------------------
// Date helpers
// ---------------------------------------------

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

// ---------------------------------------------
// Guide Attendance Page
// ---------------------------------------------

export default async function GuideAttendancePage({
  searchParams,
}: PageProps) {
  const session = await requireRole(["GUIDE"]);

  await connectDB();

  // Ensure Course model is registered before populate.
  void Course;

  const params = await searchParams;

  const requestedDate = params.date || getToday();

  const selectedDate = isValidDate(requestedDate)
    ? requestedDate
    : getToday();

  const attendanceDate = new Date(
    `${selectedDate}T00:00:00.000Z`
  );

  // ---------------------------------------------
  // 1. Retrieve guide's assigned classes
  // ---------------------------------------------

  const classes = (await ClassRecord.find({
    guide: session.user.id,
    status: { $ne: "COMPLETED" },
  })
    .populate("course", "title")
    .sort({ createdAt: -1 })
    .lean()) as unknown as ClassRecordData[];

  // ---------------------------------------------
  // 2. Prepare attendance data for each class
  // ---------------------------------------------

  const classCards = await Promise.all(
    classes.map(async (cls) => {
      const classId = String(cls._id);

      const course = cls.course as PopulatedCourse;

      const courseId = course?._id;

      // Retrieve active enrollments.
      const enrollments = (await Enrollment.find({
        class: classId,
        status: "ACTIVE",
      })
        .select("student")
        .lean()) as unknown as EnrollmentData[];

      const enrollmentIds = enrollments
        .map((item) => item.student)
        .filter((id) => id !== null && id !== undefined)
        .map((id) => String(id));

      // ---------------------------------------------
      // 3. Support legacy student records
      // ---------------------------------------------

      const legacyStudents = (await User.find({
        role: "STUDENT",
        isActive: true,
        $or: [
          { class: classId },
          ...(courseId
            ? [
                { class: null, course: courseId },
                { class: null, courseName: course?.title },
              ]
            : []),
        ],
      })
        .select("_id")
        .lean()) as unknown as StudentData[];

      const legacyIds = legacyStudents.map((student) =>
        String(student._id)
      );

      // Avoid duplicate students already enrolled in a class.
      const existingEnrollments = legacyIds.length
        ? ((await Enrollment.find({
            student: { $in: legacyIds },
          })
            .select("student")
            .lean()) as unknown as EnrollmentData[])
        : [];

      const alreadyEnrolled = new Set(
        existingEnrollments.map((item) =>
          String(item.student)
        )
      );

      const studentIds = new Set(enrollmentIds);

      legacyIds
        .filter((id) => !alreadyEnrolled.has(id))
        .forEach((id) => studentIds.add(id));

      const rosterIds = [...studentIds];

      // ---------------------------------------------
      // 4. Retrieve complete student information
      // ---------------------------------------------

      const studentRecords: StudentData[] = rosterIds.length
        ? ((await User.find({
            _id: { $in: rosterIds },
            role: "STUDENT",
            isActive: true,
          })
            .select("_id name studentId")
            .sort({ name: 1 })
            .lean()) as unknown as StudentData[])
        : [];

      const students: Student[] = studentRecords.map(
        (student) => ({
          id: String(student._id),
          name: student.name || "Unknown student",
          studentId: student.studentId || "",
        })
      );

      // ---------------------------------------------
      // 5. Retrieve existing attendance
      // ---------------------------------------------

      const attendanceRecords: AttendanceData[] =
        students.length > 0
          ? ((await Attendance.find({
              class: classId,
              student: {
                $in: students.map((student) => student.id),
              },
              date: attendanceDate,
            })
              .select("student status")
              .lean()) as unknown as AttendanceData[])
          : [];

      const hasExistingAttendance =
        attendanceRecords.length > 0;

      // ---------------------------------------------
      // 6. Initialize attendance checkboxes
      // ---------------------------------------------

      const initialPresent = hasExistingAttendance
        ? attendanceRecords
            .filter((record) => record.status === "PRESENT")
            .map((record) => String(record.student))
        : students.map((student) => student.id);

      // ---------------------------------------------
      // 7. Return serializable class data
      // ---------------------------------------------

      return {
        classId,
        className: cls.name || cls.title || "Unnamed class",
        courseTitle: course?.title || "No course assigned",
        schedule:
          typeof cls.schedule === "string"
            ? cls.schedule
            : "",
        teacherName: session.user.name || "Guide",
        students,
        hasExistingAttendance,
        initialPresent,
      };
    })
  );

  // ---------------------------------------------
  // 8. Render attendance page
  // ---------------------------------------------

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#053B2E] sm:text-3xl">
            Student Attendance
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage attendance for your assigned classes.
          </p>
        </div>

        {/* Date selector */}
        <form
          method="GET"
          action="/guide/attendance"
          className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-[#DCE7E2] bg-white p-4"
        >
          <div>
            <label
              htmlFor="attendance-date"
              className="mb-2 block text-sm font-medium text-[#12372E]"
            >
              Attendance date
            </label>

            <input
              id="attendance-date"
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-[#0B6B4F] px-5 py-2 text-sm font-semibold text-white hover:bg-[#053B2E]"
          >
            View attendance
          </button>
        </form>

        {/* Success message */}
        {params.saved === "1" && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            Attendance saved successfully.
          </div>
        )}

        {/* Error messages */}
        {params.error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {params.error === "invalid" &&
              "Invalid attendance date or submitted information."}

            {params.error === "class" &&
              "Class not found, or you are not assigned to this class."}

            {params.error === "student" &&
              "The selected student is not enrolled in this class."}

            {params.error === "roster" &&
              "No active students are registered in this class."}

            {![
              "invalid",
              "class",
              "student",
              "roster",
            ].includes(params.error) &&
              "Something went wrong. Please try again."}
          </div>
        )}

        {/* Class attendance forms */}
        {classCards.length === 0 ? (
          <div className="rounded-xl border border-[#DCE7E2] bg-white p-8 text-center">
            <h2 className="font-semibold text-[#053B2E]">
              No assigned classes
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              You currently have no active classes assigned to you.
              Please contact your manager.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {classCards.map((classData) => (
              <ClassAttendanceForm
                key={`${classData.classId}-${selectedDate}`}
                {...classData}
                date={selectedDate}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}