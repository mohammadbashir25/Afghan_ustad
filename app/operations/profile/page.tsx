import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
export const metadata = { title: "My Profile | AfghanUstad" };
export default async function OperationsProfilePage() {
  const session = await requireRole(["OPERATIONS_MANAGER"]);
  await connectDB();
  const user = await User.findById(session.user.id).select("name email role createdAt").lean();
  return <div className="space-y-5"><DashboardPageHeader eyebrow="Account" title="My Profile" description="Your AfghanUstad Operations Manager account details." /><section className="max-w-2xl rounded-xl border border-[#DCE7E2] bg-white p-5"><dl className="grid gap-4 sm:grid-cols-2"><Info label="Full name" value={user?.name || "—"} /><Info label="Email" value={user?.email || "—"} /><Info label="Role" value="Operations Manager" /><Info label="Account created" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "—"} /></dl><p className="mt-5 text-xs text-slate-500">For a name or email correction, contact the Super Admin.</p></section></div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-medium text-[#053B2E]">{value}</dd></div>; }
