"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import Announcement from "@/models/Announcement";
export async function createAnnouncementAction(fd: FormData) {
 const s=await requireRole(["SUPER_ADMIN","MANAGER"]); const base=s.user.role==="SUPER_ADMIN"?"/admin/announcements":"/manager/announcements";
 const title=String(fd.get("title")||"").trim(); const message=String(fd.get("message")||"").trim(); const audience=String(fd.get("audience")||"ALL");
 if(title.length<3||title.length>160||message.length<3||message.length>3000||!(["ALL","STUDENTS","STAFF"] as string[]).includes(audience)) redirect(`${base}?error=invalid`);
 await connectDB();
 const announcement = await Announcement.create({title,message,audience,published:true,createdBy:s.user.id});
 const User = (await import("@/models/User")).default;
 const Notification = (await import("@/models/Notification")).default;
 const targetRoles = audience === "STUDENTS" ? ["STUDENT"] : audience === "STAFF" ? ["SUPER_ADMIN","MANAGER","GUIDE","TEACHER","STAFF"] : ["SUPER_ADMIN","MANAGER","GUIDE","TEACHER","STAFF","STUDENT"];
 const recipients = await User.find({role:{$in:targetRoles},isActive:true}).select("_id").lean();
 if (recipients.length) await Notification.insertMany(recipients.map(user=>({recipient:user._id,title,message,kind:"ANNOUNCEMENT",sourceId:String(announcement._id)})));
 const AuditLog = (await import("@/models/AuditLog")).default;
 await AuditLog.create({actor:s.user.id,actorName:s.user.name||s.user.email||"Staff",action:"ANNOUNCEMENT_PUBLISHED",targetType:"Announcement",targetId:String(announcement._id),details:`Published announcement to ${audience}; notifications created for ${recipients.length} active users.`});
 revalidatePath("/admin/website"); revalidatePath("/admin/announcements"); revalidatePath("/manager/announcements"); revalidatePath("/admin/notifications"); revalidatePath("/admin/audit-logs"); redirect(`${base}?created=1`);
}
