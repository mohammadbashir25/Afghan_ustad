"use client";
import { useState } from "react";

type Item = { id: string; title: string; message: string; kind: string; read: boolean; createdAt: string | null };
export default function NotificationListClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unread = items.filter((item) => !item.read).length;
  async function update(body: { notificationId?: string; markAll?: boolean }) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error("Could not update notifications. Please try again.");
      setItems((current) => current.map((item) => body.markAll || item.id === body.notificationId ? { ...item, read: true } : item));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update notifications."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5"><div><p className="text-sm text-slate-500">Your inbox</p><h2 className="mt-1 text-2xl font-bold text-[#053B2E]">{items.length} notifications</h2><p className="mt-1 text-sm text-slate-600">{unread} unread · announcements, academic updates and finance notices.</p></div><button type="button" disabled={busy || unread === 0} onClick={() => void update({ markAll: true })} className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Mark all as read</button></div>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-semibold text-slate-800">You are all caught up</p><p className="mt-1 text-sm text-slate-500">New notifications will appear here.</p></div> : <div className="space-y-3">{items.map((item) => <article key={item.id} className={`rounded-xl border p-4 transition ${item.read ? "border-slate-200 bg-white" : "border-emerald-200 bg-emerald-50/60 shadow-sm"}`}><div className="flex items-start gap-3"><span className={`mt-2 size-2 shrink-0 rounded-full ${item.read ? "bg-slate-300" : "bg-emerald-600"}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{item.title}</h3><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{item.kind}</span>{!item.read && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">Unread</span>}</div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date unavailable"}</p></div>{!item.read && <button type="button" disabled={busy} onClick={() => void update({ notificationId: item.id })} className="shrink-0 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0B6B4F] disabled:opacity-50">Mark read</button>}</div></article>)}</div>}
  </section>;
}
