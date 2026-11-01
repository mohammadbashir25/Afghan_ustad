"use client";

import { useState } from "react";
import { saveClassAttendanceAction } from "@/app/guide/attendance/actions";

type Student = {
  id: string;
  name: string;
  studentId: string;
};

type ClassAttendanceFormProps = {
  classId: string;
  className: string;
  courseTitle: string;
  schedule: string;
  teacherName: string;
  hasExistingAttendance: boolean;
  students?: Student[];
  date: string;
  initialPresent?: string[];
};

export default function ClassAttendanceForm({
  classId,
  className,
  courseTitle,
  schedule,
  teacherName,
  hasExistingAttendance,
  students = [],
  date,
  initialPresent = [],
}: ClassAttendanceFormProps) {
  const [present, setPresent] = useState<string[]>(initialPresent);

  const all =
    students.length > 0 &&
    students.every((student) => present.includes(student.id));

  function toggle(id: string, checked: boolean) {
    setPresent((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((studentId) => studentId !== id),
    );
  }

  function toggleAll(checked: boolean) {
    setPresent(checked ? students.map((student) => student.id) : []);
  }

  const absentCount = Math.max(0, students.length - present.length);

  return (
    <section className="overflow-hidden rounded-xl border border-[#DCE7E2] bg-white shadow-sm">
      {/* Class information */}
      <div className="border-b border-[#DCE7E2] bg-slate-50 p-4">
        <h2 className="text-lg font-semibold text-[#053B2E]">{className}</h2>

        <div className="mt-2 space-y-1 text-sm text-slate-500">
          <p>Course: {courseTitle}</p>
          <p>Teacher: {teacherName || "Not assigned"}</p>
          <p>Schedule: {schedule || "Not specified"}</p>
          <p>Total students: {students.length}</p>
          <p>Date: {date}</p>
        </div>

        {hasExistingAttendance && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800">
            Attendance has already been recorded for this date. You can update
            it below.
          </p>
        )}
      </div>

      <form action={saveClassAttendanceAction} className="p-4">
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="date" value={date} />

        {/* Summary */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#12372E]">
            <input
              type="checkbox"
              checked={all}
              onChange={(e) => toggleAll(e.target.checked)}
              disabled={students.length === 0}
              className="h-4 w-4 accent-[#0B6B4F]"
            />
            Select all students as present
          </label>

          <div className="flex gap-3 text-xs font-medium">
            <span className="text-green-700">{present.length} Present</span>

            <span className="text-red-600">{absentCount} Absent</span>
          </div>
        </div>

        {/* Students */}
        <div className="divide-y divide-[#E8EFEB]">
          {students.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No students are registered in this class.
            </p>
          ) : (
            students.map((student) => {
              const isPresent = present.includes(student.id);

              return (
                <label
                  key={student.id}
                  className="flex cursor-pointer items-center justify-between gap-3 py-4 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-[#12372E]">
                      {student.name}
                    </span>

                    <span className="text-xs text-slate-500">
                      {student.studentId || "ID pending"}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isPresent}
                      onChange={(e) => toggle(student.id, e.target.checked)}
                      className="h-4 w-4 accent-[#0B6B4F]"
                    />

                    <span
                      className={
                        isPresent
                          ? "font-medium text-green-700"
                          : "text-slate-500"
                      }
                    >
                      {isPresent ? "Present" : "Absent"}
                    </span>
                  </span>
                </label>
              );
            })
          )}
        </div>

        {/* Selected students submitted to server action */}
        {present.map((id) => (
          <input key={id} type="hidden" name="presentStudent" value={id} />
        ))}

        <button
          type="submit"
          disabled={students.length === 0}
          className="mt-5 w-full rounded-lg bg-[#0B6B4F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#053B2E] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hasExistingAttendance
            ? "Update attendance for this class"
            : "Save attendance for this class"}
        </button>
      </form>
    </section>
  );
}