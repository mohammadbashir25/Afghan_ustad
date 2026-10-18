
"use client";

import { useState } from "react";
import Link from "next/link";
import StudentStatusToggle from "@/components/dashboard/users/StudentStatusToggle";
import ResetStudentPinButton from "@/components/dashboard/users/ResetStudentPinButton";
import DeleteStudentButton from "@/components/dashboard/users/DeleteStudentButton";

type Props = {
  studentId: string;
  studentName: string;
  isActive: boolean;
};

export default function StudentAccountMenu({
  studentId,
  studentName,
  isActive,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-[#DCE7E2] bg-white px-4 py-2 text-sm font-semibold text-[#053B2E] shadow-sm transition hover:bg-[#F3F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F]"
      >
        Manage
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-56 space-y-1 rounded-xl border border-[#DCE7E2] bg-white p-2 shadow-lg">
          <Link
            href={`/admin/students/${studentId}/edit`}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-[#053B2E] hover:bg-[#E6F4EE]"
          >
            Edit student
          </Link>

          <div className="rounded-lg px-2 py-1">
            <StudentStatusToggle
              studentId={studentId}
              isActive={isActive}
            />
          </div>

          {isActive && (
            <div className="rounded-lg px-2 py-1">
              <ResetStudentPinButton studentId={studentId} />
            </div>
          )}

          <div className="border-t border-[#E8EFEB] pt-2">
            <DeleteStudentButton
              studentId={studentId}
              studentName={studentName}
            />
          </div>
        </div>
      )}
    </div>
  );
}
