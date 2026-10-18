import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import ResourcePage from "@/components/dashboard/ResourcePage";

export default async function NotificationList({ role }: { role: "SUPER_ADMIN" | "MANAGER" | "GUIDE" | "TEACHER" | "STAFF" | "STUDENT" }) {
  const session = await requireRole([role]);
  await connectDB();
  // Every account sees only notifications addressed to that account. Admins do not get other users' private notifications.
  const rows = await Notification.find({ recipient: session.user.id }).sort({ createdAt: -1 }).limit(250).lean();
  return <ResourcePage eyebrow="Notifications" title="Notifications" description="Your announcements, finance updates, and academic notifications." stats={[{ label: "Notifications", value: rows.length }, { label: "Unread", value: rows.filter((n) => !n.readAt).length }, { label: "Announcements", value: new Set(rows.filter((n) => n.kind === "ANNOUNCEMENT").map((n) => n.sourceId).filter(Boolean)).size }]} rows={rows.map((n) => ({ title: n.title, detail: n.message, status: n.readAt ? "Read" : "Unread", meta: n.createdAt ? new Date(n.createdAt).toLocaleString("en-GB") : "—" }))} empty="You do not have any notifications yet." />;
}
