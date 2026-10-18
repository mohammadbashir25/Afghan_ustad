import Link from "next/link";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import User from "@/models/User";
import { createClassAction } from "@/app/admin/catalog-actions";
export const metadata = { title: "Add Class | AfghanUstad" };
const field = "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm text-[#12372E]";
export default async function NewClassPage() {
  await requireRole(["SUPER_ADMIN", "MANAGER"]); await connectDB();
  const [courses, guides, teachers] = await Promise.all([Course.find({ status: "ACTIVE" }).select("title _id").sort({title:1}).lean(), User.find({ role: "GUIDE", isActive: true }).select("name _id").sort({name:1}).lean(), User.find({ role: "TEACHER", isActive: true }).select("name _id").sort({name:1}).lean()]);
  return <div className="space-y-6"><DashboardPageHeader eyebrow="Learning" title="Add class" description="Schedule a class and optionally assign an active Skill Center guide." />{courses.length === 0 ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Create an active course first. <Link className="underline" href="/admin/courses/new">Add course</Link></p> : <form action={createClassAction} className="grid max-w-3xl gap-4 rounded-xl border border-[#DCE7E2] bg-white p-5 sm:grid-cols-2">
    <label className="text-sm font-medium">Class name<input name="name" required maxLength={120} className={field}/></label>
    <label className="text-sm font-medium">Course<select name="courseId" required className={field}>{courses.map(c=><option key={String(c._id)} value={String(c._id)}>{c.title}</option>)}</select></label>
    <label className="text-sm font-medium">Guide<select name="guideId" defaultValue="" className={field}><option value="">Not assigned</option>{guides.map(g=><option key={String(g._id)} value={String(g._id)}>{g.name}</option>)}</select></label>
    <label className="text-sm font-medium">Assigned teacher<select name="teacherId" defaultValue="" className={field}><option value="">Not assigned</option>{teachers.map(t=><option key={String(t._id)} value={String(t._id)}>{t.name}</option>)}</select></label>
    <label className="text-sm font-medium">Schedule<input name="schedule" required maxLength={160} placeholder="Sun/Tue, 9:00–11:00" className={field}/></label>
    <label className="text-sm font-medium">Start date<input name="startDate" type="date" className={field}/></label>
    <label className="text-sm font-medium">End date<input name="endDate" type="date" className={field}/></label>
    <label className="text-sm font-medium">Status<select name="status" defaultValue="UPCOMING" className={field}><option value="UPCOMING">Upcoming</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option></select></label>
    <div className="flex items-end gap-3"><button className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">Save class</button><Link href="/admin/classes" className="px-3 py-2 text-sm">Cancel</Link></div>
  </form>}</div>;
}
