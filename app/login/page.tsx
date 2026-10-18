"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from "react-icons/fi";
import { DASHBOARD_HOME, isUserRole } from "@/lib/users/roles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { email: email.trim().toLowerCase(), password, redirect: false });
      if (result?.error) {
        setError("We couldn’t sign you in with those credentials. Check them and try again.");
        setLoading(false);
        return;
      }
      const session = await getSession();
      const role = session?.user?.role;
      if (!role || !isUserRole(role)) {
        setError("Your account is missing a valid role. Please contact an administrator.");
        setLoading(false);
        return;
      }
      router.replace(DASHBOARD_HOME[role]);
      router.refresh();
    } catch {
      setError("Sign-in is temporarily unavailable. Please try again in a moment.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#071E18] px-4 py-10 text-slate-900">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 size-[30rem] rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-white shadow-2xl shadow-black/30 lg:grid-cols-[1fr_1.05fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0B6B4F] via-[#064B38] to-[#052D23] p-10 text-white lg:flex">
          <div className="absolute -right-20 top-1/3 size-64 rounded-full border border-white/10" /><div className="absolute -right-10 top-[38%] size-44 rounded-full border border-white/10" />
          <div className="relative"><div className="flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-bold">AU</div><p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-100">AfghanUstad</p><h1 className="mt-3 max-w-sm text-4xl font-semibold leading-tight">Learn skills.<br/>Build your future.</h1><p className="mt-5 max-w-sm text-sm leading-7 text-emerald-50/80">A secure workspace for learning, teaching, managing classes, and tracking progress.</p></div>
          <div className="relative flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"><span className="flex size-10 items-center justify-center rounded-xl bg-white/10"><FiShield className="size-5"/></span><div><p className="text-sm font-semibold">Protected workspace</p><p className="mt-1 text-xs text-emerald-50/70">Your role determines your access.</p></div></div>
        </aside>
        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="flex size-11 items-center justify-center rounded-xl bg-[#E6F4EE] font-bold text-[#0B6B4F]">AU</span><div><p className="font-bold text-[#053B2E]">AfghanUstad</p><p className="text-xs text-slate-500">Learning workspace</p></div></div>
          <div className="mb-8"><p className="text-sm font-semibold text-[#0B6B4F]">WELCOME BACK</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#12372E]">Sign in to continue</h2><p className="mt-2 text-sm leading-6 text-slate-500">Use the account credentials provided by your administrator.</p></div>
          <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
            <div><label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label><div className="relative"><FiMail aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"/><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" inputMode="email" maxLength={254} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 ps-11 pe-4 text-sm outline-none transition focus:border-[#0B6B4F] focus:bg-white focus:ring-4 focus:ring-emerald-900/10" placeholder="you@example.com"/></div></div>
            <div><label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label><div className="relative"><FiLock aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"/><input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" maxLength={256} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 ps-11 pe-12 text-sm outline-none transition focus:border-[#0B6B4F] focus:bg-white focus:ring-4 focus:ring-emerald-900/10" placeholder="Enter your password"/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute end-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F]">{showPassword ? <FiEyeOff className="size-4"/> : <FiEye className="size-4"/>}</button></div></div>
            {error && <p role="alert" aria-live="polite" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700">{error}</p>}
            <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B6B4F] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/15 transition hover:bg-[#08553E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing you in…" : "Sign in securely"}{!loading && <FiArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5"/>}</button>
          </form>
          <p className="mt-7 text-center text-xs leading-5 text-slate-400">If you cannot access your account, contact your AfghanUstad administrator.</p>
        </section>
      </div>
    </main>
  );
}
