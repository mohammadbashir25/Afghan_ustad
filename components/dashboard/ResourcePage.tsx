import Link from "next/link";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";

type Stat = { label: string; value: string | number; detail?: string };
type Row = { title: string; detail?: string; status?: string; meta?: string };
type Action = { href: string; label: string };
export default function ResourcePage({ eyebrow, title, description, stats = [], rows = [], actions = [], empty = "No records are available yet." }: { eyebrow: string; title: string; description: string; stats?: Stat[]; rows?: Row[]; actions?: Action[]; empty?: string }) {
  return <div className="space-y-6">
    <DashboardPageHeader eyebrow={eyebrow} title={title} description={description} />
    {actions.length > 0 && <div className="flex flex-wrap gap-3">{actions.map(a => <Link key={a.href} href={a.href} className="inline-flex min-h-10 items-center rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#053B2E]">{a.label}</Link>)}</div>}
    {stats.length > 0 && <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(s => <article key={s.label} className="rounded-xl border border-[#DCE7E2] bg-white p-5"><p className="text-sm text-slate-500">{s.label}</p><p className="mt-2 text-2xl font-bold text-[#053B2E]">{s.value}</p>{s.detail && <p className="mt-1 text-xs text-slate-500">{s.detail}</p>}</article>)}</section>}
    <section className="overflow-hidden rounded-xl border border-[#DCE7E2] bg-white"><div className="border-b border-[#DCE7E2] px-5 py-4"><h2 className="font-semibold text-[#053B2E]">Records</h2></div>{rows.length ? <div className="divide-y divide-[#E7EEEA]">{rows.map((r,i)=><article key={`${r.title}-${i}`} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className="font-medium text-[#12372E]">{r.title}</h3>{r.detail && <p className="mt-1 text-sm text-slate-500">{r.detail}</p>}</div><div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">{r.meta && <span>{r.meta}</span>}{r.status && <span className="rounded-full bg-[#E6F4EE] px-2.5 py-1 font-medium text-[#053B2E]">{r.status}</span>}</div></article>)}</div> : <p className="px-5 py-10 text-center text-sm text-slate-500">{empty}</p>}</section>
  </div>;
}
