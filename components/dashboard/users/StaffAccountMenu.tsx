
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  resetStaffPasswordAction,
  setStaffActiveAction,
} from "@/app/admin/users/actions";
import { deleteStaffAccountAction } from "@/app/admin/users/actions";

type Props = {
  userId: string;
  userName: string;
  isActive: boolean;
};

export default function StaffAccountMenu({
  userId,
  userName,
  isActive,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  function toggleStatus() {
    const next = !isActive;
    const verb = next ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${verb} ${userName}'s account?`)) {
      return;
    }

    setMessage("");
    setTemporaryPassword("");

    startTransition(async () => {
      const result = await setStaffActiveAction(userId, next);
      setMessage(result.message);

      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  function resetPassword() {
    if (!window.confirm(`Reset the password for ${userName}? Their current password will stop working.`)) {
      return;
    }

    setMessage("");
    setTemporaryPassword("");

    startTransition(async () => {
      const result = await resetStaffPasswordAction(userId);
      setMessage(result.message);

      if (result.success && result.password) {
        setTemporaryPassword(result.password);
      }
    });
  }

  function deleteAccount() {
    const confirmation = window.prompt(
      `Permanently delete ${userName}? Type DELETE to confirm.`,
    );

    if (confirmation !== "DELETE") return;

    setMessage("");
    setTemporaryPassword("");

    startTransition(async () => {
      const result = await deleteStaffAccountAction(userId);
      setMessage(result.message);

      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-[#DCE7E2] bg-white px-4 py-2 text-sm font-semibold text-[#053B2E] shadow-sm hover:bg-[#F3F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F]"
      >
        Manage <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-[#DCE7E2] bg-white p-2 shadow-lg">
          <button
            type="button"
            disabled={pending}
            onClick={toggleStatus}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-[#F3F8F5] disabled:opacity-50 ${
              isActive ? "text-red-700" : "text-[#0B6B4F]"
            }`}
          >
            {isActive ? "Deactivate account" : "Activate account"}
          </button>

          <button
            type="button"
            disabled={pending || !isActive}
            onClick={resetPassword}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#053B2E] hover:bg-[#F3F8F5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset password
          </button>
          <div className="my-1 border-t border-[#E8EFEB] pt-1">
  <button
    type="button"
    disabled={pending}
    onClick={deleteAccount}
    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
  >
    Delete account
  </button>
</div>
        </div>
        
      )}

      {(message || temporaryPassword) && (
        <div className="mt-2 max-w-64 space-y-2 text-xs text-slate-600" role="status">
          {message && <p>{message}</p>}
          {temporaryPassword && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="font-semibold text-amber-950">Temporary password</p>
              <p className="mt-1 break-all font-mono text-sm font-bold text-amber-950">
                {temporaryPassword}
              </p>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(temporaryPassword);
                  setMessage("Temporary password copied.");
                }}
                className="mt-2 rounded border border-amber-300 px-2 py-1 font-medium text-amber-950 hover:bg-amber-100"
              >
                Copy password
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
