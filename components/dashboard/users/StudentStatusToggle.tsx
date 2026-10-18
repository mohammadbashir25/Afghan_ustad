
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStudentActiveAction } from "@/app/admin/users/actions";

type Props = {
  studentId: string;
  isActive: boolean;
};

export default function StudentStatusToggle({
  studentId,
  isActive,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleToggle() {
    const nextStatus = !isActive;
    const action = nextStatus ? "activate" : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} this student account?`,
      )
    ) {
      return;
    }

    setMessage("");

    startTransition(async () => {
      try {
        const result = await setStudentActiveAction(
          studentId,
          nextStatus,
        );

        setMessage(result.message);

        if (result.success) {
          router.refresh();
        }
      } catch {
        setMessage("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={`rounded-lg px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
          isActive
            ? "bg-red-600 hover:bg-red-700"
            : "bg-[#0B6B4F] hover:bg-[#053B2E]"
        }`}
      >
        {pending
          ? "Updating..."
          : isActive
            ? "Deactivate"
            : "Activate"}
      </button>

      {message && (
        <p role="status" className="max-w-48 text-xs text-gray-600">
          {message}
        </p>
      )}
    </div>
  );
}
