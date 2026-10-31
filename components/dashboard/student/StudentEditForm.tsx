"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStudentAction } from "@/app/admin/students/actions";
type ClassOption = {
  id: string;
  name: string;
  schedule: string;
  courseId: string;
  courseTitle: string;
  teacherName: string;
};
export default function StudentEditForm({
  student,
  returnTo,
  classes,
}: {
  student: {
    id: string;
    name: string;
    fatherName: string;
    whatsappNumber: string;
    classId?: string;
    courseId?: string;
  };
  returnTo: string;
  classes: ClassOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  function submit(fd: FormData) {
    startTransition(async () => {
      const result = await updateStudentAction(fd);
      setMessage(result.message);
      if (result.success) router.push(returnTo);
    });
  }
  const options = classes.filter(
    (c) => !student.courseId || c.courseId === student.courseId,
  );
  return (
    <form
      action={submit}
      className="grid max-w-2xl gap-4 rounded-xl border border-[#DCE7E2] bg-white p-5 sm:grid-cols-2"
    >
      <input type="hidden" name="studentId" value={student.id} />
      <label className="text-sm font-medium">
        Full name
        <input
          name="name"
          required
          minLength={2}
          maxLength={120}
          defaultValue={student.name}
          className="mt-1 w-full rounded-lg border border-[#DCE7E2] px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm font-medium">
        Father&lsquo;s name
        <input
          name="fatherName"
          required
          minLength={2}
          maxLength={120}
          defaultValue={student.fatherName}
          className="mt-1 w-full rounded-lg border border-[#DCE7E2] px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm font-medium">
        WhatsApp number
        <input
          name="whatsappNumber"
          type="tel"
          required
          minLength={7}
          maxLength={32}
          defaultValue={student.whatsappNumber}
          className="mt-1 w-full rounded-lg border border-[#DCE7E2] px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        Class / batch
        <select
          name="classId"
          defaultValue={student.classId || ""}
          className="mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm"
        >
          <option value="">No class assigned</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.schedule} · {c.teacherName} · {c.courseTitle}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-500">
          Choose an active class from the student&lsquo;s current course. Selecting “No class assigned” removes the class assignment.
        </span>
      </label>
      {message && (
        <p role="status" className="text-sm text-slate-600 sm:col-span-2">
          {message}
        </p>
      )}
      <button
        disabled={pending}
        className="w-fit rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
