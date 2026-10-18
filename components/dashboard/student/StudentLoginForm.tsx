"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [studentId, setStudentId] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const result = await signIn("credentials", {
        studentId: studentId.trim(),
        username: username.trim().toLowerCase(),
        pin,
        redirect: false,
      });

      if (!result || result.error) {
        setError("The student ID, username, or PIN is incorrect, or the account is inactive.");
        return;
      }

      const requested = searchParams.get("callbackUrl");
      // Do not send a student to staff/admin routes via a crafted callback URL.
      const destination =
        requested && requested.startsWith("/student") && !requested.startsWith("//")
          ? requested
          : "/student";

      router.replace(destination);
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "mt-1 h-11 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 text-sm text-[#12372E] outline-none focus:ring-2 focus:ring-[#0B6B4F]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="studentId" className="text-sm font-medium text-[#12372E]">Student ID</label>
        <input id="studentId" name="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)}
          autoComplete="username" required maxLength={40} className={inputClass} />
      </div>
      <div>
        <label htmlFor="username" className="text-sm font-medium text-[#12372E]">Username</label>
        <input id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)}
          autoComplete="username" required maxLength={40} className={inputClass} />
      </div>
      <div>
        <label htmlFor="pin" className="text-sm font-medium text-[#12372E]">PIN (4–8 digits)</label>
        <input id="pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4,8}"
          autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value)}
          required minLength={4} maxLength={8} className={inputClass} />
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={pending}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-[#0B6B4F] px-4 text-sm font-semibold text-white transition hover:bg-[#053B2E] disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-xs leading-5 text-[#64748B]">
        If you have not received a PIN, contact your manager. Do not share your PIN with anyone.
      </p>
    </form>
  );
}
