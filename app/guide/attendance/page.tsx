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
  students: Student[];
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
  students,
  date,
  initialPresent = [],
}: ClassAttendanceFormProps) {
  const [present, setPresent] = useState<string[]>(initialPresent);

  const all = students.length > 0 && present.length === students.length;

  function toggle(id: string, checked: boolean) {
    setPresent((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((studentId) => studentId !== id),
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#DCE7E2] bg-white">
      {/* Class information */}
      <div className="border-b border-[#DCE7E2] bg-slate-50 p-4">
        <h2 className="font-semibold text-[#053B2E]">{className}</h2>

        <div className="mt-2 space-y-1 text-sm text-slate-500">
          <p>Course: {courseTitle}</p>
          <p>Teacher: {teacherName || "Not assigned"}</p>
          <p>Schedule: {schedule || "Not specified"}</p>
          <p>Total students: {students.length}</p>
          <p>Date: {date}</p>
        </div>

        {hasExistingAttendance && (
          <p className="mt-3 text-sm font-medium text-amber-700">
            Attendance has already been recorded for this date. You can update
            it below.
          </p>
        )}
      </div>

      <form action={saveClassAttendanceAction} className="p-4">
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="date" value={date} />

        {/* Attendance summary */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#12372E]">
            <input
              type="checkbox"
              checked={all}
              onChange={(e) =>
                setPresent(
                  e.target.checked ? students.map((student) => student.id) : [],
                )
              }
              disabled={students.length === 0}
              className="h-4 w-4 accent-[#0B6B4F]"
            />
            Select all students as present
          </label>

          <span className="text-xs font-medium text-slate-500">
            {present.length} present · {students.length - present.length} absent
          </span>
        </div>

        {/* Student list */}
        <div className="divide-y divide-[#E8EFEB]">
          {students.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No students are registered in this class.
            </p>
          ) : (
            students.map((student) => {
              const isPresent = present.includes(student.id);

              return (
                <label
                  key={student.id}
                  className="flex cursor-pointer items-center justify-between gap-3 py-3 text-sm"
                >
                  <span>
                    <span className="font-medium text-[#12372E]">
                      {student.name}
                    </span>

                    <span className="ml-2 text-xs text-slate-500">
                      {student.studentId || "ID pending"}
                    </span>
                  </span>

                  <span className="flex items-center gap-2">
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

        {/* Hidden inputs submitted to the server action */}
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
