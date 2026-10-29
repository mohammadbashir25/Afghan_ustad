"use client";
import { useState } from "react";
import { enrollExistingStudentAction } from "@/app/manager/students/enroll/actions";
type Student = {
  id: string;
  name: string;
  studentId: string;
  whatsappNumber: string;
  isActive: boolean;
};
type Course = { id: string; title: string; fee: number };
type ClassOption = {
  id: string;
  name: string;
  courseId: string;
  courseTitle: string;
  schedule: string;
  teacherName?: string;
};
const field =
  "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm";
export default function EnrollExistingStudentForm({
  students,
  courses,
  classes,
}: {
  students: Student[];
  courses: Course[];
  classes: ClassOption[];
}) {
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const filteredStudents = students.filter((s) =>
    `${s.name} ${s.studentId}`
      .toLowerCase()
      .includes(studentSearch.trim().toLowerCase()),
  );
  return (
    <form
      action={enrollExistingStudentAction}
      className="grid max-w-3xl gap-4 rounded-xl border border-[#DCE7E2] bg-white p-5 sm:grid-cols-2"
    >
      <label className="text-sm font-medium sm:col-span-2">
        Search student by name or ID
        <input
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          placeholder="Type student name or AU ID..."
          className={field}
        />
        <select name="studentId" required className={field}>
          <option value="">Select matching student</option>
          {filteredStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.studentId || "ID pending"} ·{" "}
              {s.whatsappNumber || "No WhatsApp"}{" "}
              {s.isActive ? "· Active" : "· Inactive"}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Course
        <select
          name="courseId"
          required
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setClassId("");
          }}
          className={field}
        >
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} · {c.fee.toLocaleString()} AFN
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Related class
        <select
          name="classId"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className={field}
        >
          <option value="">No class selected</option>
          {classes
            .filter((c) => c.courseId === courseId)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.schedule} · Teacher:{" "}
                {c.teacherName || "Not assigned"}
              </option>
            ))}
        </select>
        <span className="text-xs text-slate-500">
          Only classes belonging to the selected course are shown.
        </span>
      </label>
      <label className="text-sm font-medium">
        Discount (AFN)
        <input
          name="discountAmount"
          type="number"
          min="0"
          step="0.01"
          defaultValue="0"
          required
          className={field}
        />
      </label>
      <label className="text-sm font-medium">
        Initial payment (AFN)
        <input
          name="amountPaid"
          type="number"
          min="0"
          step="0.01"
          defaultValue="0"
          required
          className={field}
        />
      </label>
      <label className="text-sm font-medium">
        Payment method
        <select name="method" className={field}>
          <option value="CASH">Cash</option>
          <option value="BANK">Bank transfer</option>
          <option value="MOBILE_MONEY">Mobile money</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <div className="sm:col-span-2">
        <button className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">
          Save enrollment
        </button>
      </div>
    </form>
  );
}
