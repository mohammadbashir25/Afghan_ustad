"use client";
import { useState } from "react";
import { saveClassAttendanceAction } from "@/app/guide/attendance/actions";
type Student = { id: string; name: string; studentId: string };

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
  const [present, setPresent] = useState<string[]>(
    initialPresent ?? students.map((s) => s.id),
  );
  const all = present.length === students.length && students.length > 0;
  function toggle(id: string, checked: boolean) {
    setPresent((old) =>
      checked ? [...new Set([...old, id])] : old.filter((x) => x !== id),
    );
  }
  return (
    <section className="overflow-hidden rounded-xl border border-[#DCE7E2] bg-white">
      <div className="border-b bg-slate-50 p-4">
        <h2 className="font-semibold text-[#053B2E]">{className}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {courseTitle} · {schedule} · {students.length} students
        </p>
      </div>
      <form action={saveClassAttendanceAction} className="p-4">
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="date" value={date} />
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={all}
              onChange={(e) =>
                setPresent(e.target.checked ? students.map((s) => s.id) : [])
              }
            />{" "}
            Select all students as present
          </label>
          <span className="text-xs text-slate-500">
            {present.length} present · {students.length - present.length} absent
          </span>
        </div>
        <div className="divide-y">
          {students.map((student) => (
            <label
              key={student.id}
              className="flex items-center justify-between gap-3 py-3 text-sm"
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
                  checked={present.includes(student.id)}
                  onChange={(e) => toggle(student.id, e.target.checked)}
                />
                <span>
                  {present.includes(student.id) ? "Present" : "Absent"}
                </span>
              </span>
            </label>
          ))}
        </div>
        {present.map((id) => (
          <input key={id} type="hidden" name="presentStudent" value={id} />
        ))}
        <button className="mt-4 rounded-lg bg-[#0B6B4F] px-4 py-2.5 text-sm font-semibold text-white">
          Save attendance for this class
        </button>
      </form>
    </section>
  );
}
