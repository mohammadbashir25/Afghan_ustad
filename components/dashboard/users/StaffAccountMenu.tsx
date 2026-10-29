"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiChevronDown,
  FiEdit3,
  FiKey,
  FiPower,
  FiTrash2,
} from "react-icons/fi";

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
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-xl border border-[#BFD8CC] bg-[#F4FAF6] px-3.5 py-2.5 text-sm font-semibold text-[#07563F] shadow-sm transition hover:border-[#0B6B4F] hover:bg-[#E6F4EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2"
      >
        Manage student
        <FiChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close student actions menu"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div
            role="menu"
            className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-[#DCE7E2] bg-white p-2 shadow-xl shadow-[#053B2E]/10 ring-1 ring-black/5"
          >
            <div className="border-b border-[#E8EFEB] px-3 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
                Student account
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-[#053B2E]">
                {studentName}
              </p>
            </div>

            <Link
              role="menuitem"
              href={`/admin/students/${studentId}/edit`}
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#12372E] transition hover:bg-[#E6F4EE]"
            >
              <FiEdit3 className="size-4 text-[#0B6B4F]" />
              Edit student details
            </Link>

            <div className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
              <FiPower className="mt-0.5 size-4 shrink-0 text-[#0B6B4F]" />
              <div className="min-w-0 flex-1">
                <StudentStatusToggle
                  studentId={studentId}
                  isActive={isActive}
                />
              </div>
            </div>

            {isActive && (
              <div className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
                <FiKey className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <ResetStudentPinButton studentId={studentId} />
                </div>
              </div>
            )}

            <div className="mt-1 border-t border-[#F1D9D9] pt-1">
              <div className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-red-50">
                <FiTrash2 className="mt-0.5 size-4 shrink-0 text-red-600" />
                <div className="min-w-0 flex-1">
                  <DeleteStudentButton
                    studentId={studentId}
                    studentName={studentName}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
