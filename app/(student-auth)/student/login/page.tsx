import type { Metadata } from "next";
import { Suspense } from "react";
import StudentLoginForm from "@/components/dashboard/student/StudentLoginForm";

export const metadata: Metadata = {
  title: "Student Login | AfghanUstad",
  description: "Sign in to your AfghanUstad student dashboard.",
};

export default function StudentLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#DCE7E2] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7">
          <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-[#0B6B4F] font-semibold text-white">
            A
          </div>
          <p className="text-sm font-semibold text-[#0B6B4F]">AfghanUstad</p>
          <h1 className="mt-1 text-2xl font-bold text-[#053B2E]">Student login</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Use the student ID, username, and PIN given to you by the training center.
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading sign-in form…</p>}>
          <StudentLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
