import Link from "next/link";
import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import { requireRole } from "@/lib/auth/requireRole";
import { createCourseAction } from "@/app/admin/catalog-actions";
export const metadata = { title: "Add Course | AfghanUstad" };
const field = "mt-1 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 py-2 text-sm";
function TextField({label,name,required=true,placeholder,type="text"}:{label:string;name:string;required?:boolean;placeholder?:string;type?:string}) { return <label className="text-sm font-medium">{label}<input name={name} type={type} required={required} placeholder={placeholder} className={field}/></label>; }
function TextArea({label,name}:{label:string;name:string}) { return <label className="text-sm font-medium">{label}<textarea name={name} required minLength={10} maxLength={3000} rows={3} className={field}/></label>; }
export default async function NewCoursePage() {
  const session = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const base = session.user.role === "MANAGER" ? "/manager/courses" : "/admin/courses";
  return <div className="space-y-6"><DashboardPageHeader eyebrow="Learning" title="Add course" description="Every public course requires English, Dari and Pashto content, a unique slug, a thumbnail and complete course details."/><form action={createCourseAction} encType="multipart/form-data" className="grid max-w-5xl gap-6 rounded-xl border border-[#DCE7E2] bg-white p-5 md:grid-cols-2">
    <section className="space-y-4 md:col-span-2"><h2 className="font-semibold text-[#053B2E]">Course identity</h2><div className="grid gap-4 md:grid-cols-2"><TextField label="URL slug (English letters, numbers and hyphens)" name="slug" placeholder="front-end-development"/><TextField label="Thumbnail (JPG, PNG or WebP; max 5 MB)" name="thumbnail" type="file"/><TextField label="Fee (AFN)" name="fee" type="number"/><label className="text-sm font-medium">Level<select name="level" required className={field}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label className="text-sm font-medium">Status<select name="status" defaultValue="DRAFT" className={field}><option value="DRAFT">Draft</option><option value="ACTIVE">Published</option><option value="ARCHIVED">Archived</option></select></label><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="featured" value="true"/> Feature this course on the homepage</label></div></section>
    <section className="space-y-4"><h2 className="font-semibold text-[#053B2E]">English</h2><TextField label="Course name" name="titleEn"/><TextField label="Category" name="categoryEn"/><TextField label="Duration" name="durationEn" placeholder="8 weeks"/><TextArea label="Description" name="descriptionEn"/></section>
    <section className="space-y-4"><h2 className="font-semibold text-[#053B2E]">دری (Dari)</h2><TextField label="نام کورس" name="titleFa"/><TextField label="دسته‌بندی" name="categoryFa"/><TextField label="مدت دوره" name="durationFa"/><TextArea label="توضیحات" name="descriptionFa"/></section>
    <section className="space-y-4 md:col-span-2"><h2 className="font-semibold text-[#053B2E]">پښتو (Pashto)</h2><div className="grid gap-4 md:grid-cols-2"><TextField label="د کورس نوم" name="titlePs"/><TextField label="کټګوري" name="categoryPs"/><TextField label="موده" name="durationPs"/><TextArea label="تشریح" name="descriptionPs"/></div></section>
    <div className="flex items-end gap-3 md:col-span-2"><button className="rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white">Save course</button><Link href={base} className="px-3 py-2 text-sm">Cancel</Link></div>
  </form></div>;
}
