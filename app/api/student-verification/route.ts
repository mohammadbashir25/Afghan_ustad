import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";

const schema = z.object({ mode: z.enum(["id", "name"]), value: z.string().trim().min(2).max(120) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "not_found" }, { status: 400 });
  try {
    await connectDB();
    const query = parsed.data.mode === "id"
      ? { studentId: { $regex: `^${parsed.data.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }, role: "STUDENT", isActive: true }
      : { name: { $regex: parsed.data.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }, role: "STUDENT", isActive: true };
    const student = await User.findOne(query).select("name studentId course courseName createdAt").lean();
    if (!student) return NextResponse.json({ status: "not_found" });
    let courseTitle = student.courseName || undefined;
    if (student.course) { const course = await Course.findById(student.course).select("title titleI18n").lean(); const title = course as unknown as { title?: string; titleI18n?: { en?: string } } | null; courseTitle = title?.titleI18n?.en || title?.title || courseTitle; }
    return NextResponse.json({ status: "verified", record: { studentName: student.name, verificationId: student.studentId || undefined, courseTitle, issuedOn: student.createdAt ? new Date(student.createdAt).toISOString().slice(0,10) : undefined } });
  } catch (error) {
    console.error("Student verification failed", error);
    return NextResponse.json({ message: "Verification is temporarily unavailable" }, { status: 500 });
  }
}
