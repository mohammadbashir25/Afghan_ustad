"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import TalentBookmark from "@/models/TalentBookmark";
import AuditLog from "@/models/AuditLog";
export async function bookmarkTalentAction(fd:FormData){const s=await requireRole(["SUPER_ADMIN"]);const studentId=String(fd.get("studentId")||"");const note=String(fd.get("note")||"").trim();if(!/^[a-f\d]{24}$/i.test(studentId)||note.length>1000)redirect("/admin/leaderboard?error=invalid");await connectDB();const student=await User.findOne({_id:studentId,role:"STUDENT",isActive:true}).select("name studentId").lean();if(!student)redirect("/admin/leaderboard?error=student");await TalentBookmark.findOneAndUpdate({student:studentId},{$set:{bookmarkedBy:s.user.id,note}},{upsert:true,new:true,runValidators:true});await AuditLog.create({actor:s.user.id,actorName:s.user.name||s.user.email||"Super Admin",action:"TALENT_BOOKMARKED",targetType:"Student",targetId:studentId,details:`Bookmarked ${student.name} for future opportunities.`});revalidatePath("/admin/leaderboard");redirect("/admin/leaderboard?bookmarked=1")}
