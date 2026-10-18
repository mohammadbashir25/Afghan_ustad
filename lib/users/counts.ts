/**
 * Read-only count queries for dashboards. Server-only by convention: import
 * from Server Components, route handlers and server actions, never from
 * "use client" files. The caller is responsible for authorization.
 *
 * Returns only a number, so no user data can leak through it.
 */

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Number of student accounts that can currently sign in.
 *
 * `isActive: { $ne: false }` treats accounts created before the field existed
 * as active, matching the schema default and the Users page.
 *
 * Returns null if the database can't be reached, so the dashboard can show
 * "Not connected" instead of a misleading zero.
 */
export async function countActiveStudents(): Promise<number | null> {
  try {
    await connectDB();
    return await User.countDocuments({ role: "STUDENT", isActive: { $ne: false } });
  } catch (error) {
    console.error("countActiveStudents failed", error);
    return null;
  }
}