import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/** Verify the JWT role and re-check active status in MongoDB on every student route. */
export async function requireStudent() {
  const session = await auth();
  if (!session?.user) redirect("/student/login");
  if (session.user.role !== "STUDENT") redirect("/login");
  await connectDB();
  const active = await User.exists({ _id: session.user.id, role: "STUDENT", isActive: true });
  if (!active) redirect("/student/login?reason=inactive");
  return session;
}
