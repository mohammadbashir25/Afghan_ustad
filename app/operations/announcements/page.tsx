import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Announcement from "@/models/Announcement";
import ResourcePage from "@/components/dashboard/ResourcePage";
export const metadata = { title: "Announcements | AfghanUstad" };
export default async function OperationsAnnouncementsPage() {
  await requireRole(["OPERATIONS_MANAGER"]);
  await connectDB();
  const items = await Announcement.find({ published: true }).sort({ createdAt: -1 }).limit(100).lean();
  return <ResourcePage eyebrow="Operations" title="Announcements" description="Read official notices published by the Super Admin or Manager." stats={[{ label: "Published announcements", value: items.length }]} rows={items.map((item) => ({ title: item.title, detail: item.message, status: item.audience, meta: new Date(item.createdAt).toLocaleDateString("en-GB") }))} empty="No announcements have been published." />;
}
