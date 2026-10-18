/**
 * Read-only user queries. Server-only by convention: import this from Server
 * Components, route handlers and server actions, never from "use client" files.
 *
 * The caller is responsible for authorization (see requireRole).
 *
 * Safety:
 *  - Explicit field list: the password hash is never selected. The schema
 *    also has select: false on `password`, so this is defence in depth.
 *  - Search text is escaped before it becomes a RegExp, so input like ".*"
 *    is matched literally and can't trigger regex injection.
 *  - Role/status come in as already-validated values, never raw strings.
 */

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import type { UserRole } from "./roles";

export type UserStatusFilter = "active" | "inactive";

export interface UserListFilters {
  query: string;
  role: UserRole | null;
  status: UserStatusFilter | null;
}

/** Serializable row, safe to pass to the table. No password field exists here. */
export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  /** ISO 8601 string, or null for old documents without timestamps. */
  createdAt: string | null;
}

/** Shape of the lean documents returned by the query below. */
interface UserDoc {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: Date;
}

interface UserQuery {
  role?: UserRole | { $in: UserRole[] };
  isActive?: boolean | { $ne: boolean };
  $or?: Array<{ name: RegExp } | { email: RegExp }>;
}

const STAFF_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "MANAGER",
  "GUIDE",
  "TEACHER",
  "STAFF",
];

const MAX_QUERY_LENGTH = 100;
const MAX_ROWS = 100;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listUsers(
  filters: UserListFilters,
): Promise<{ users: UserRow[]; truncated: boolean }> {
  await connectDB();

const query: UserQuery = {
  role: filters.role && STAFF_ROLES.includes(filters.role)
    ? filters.role
    : { $in: STAFF_ROLES },
};

  // Accounts created before `isActive` existed have no value. Treat them as
  // active, matching the schema default, so existing accounts stay "Active".
  if (filters.status === "active") query.isActive = { $ne: false };
  if (filters.status === "inactive") query.isActive = false;

  const needle = filters.query.trim().slice(0, MAX_QUERY_LENGTH);
  if (needle) {
    const pattern = new RegExp(escapeRegExp(needle), "i");
    query.$or = [{ name: pattern }, { email: pattern }];
  }

  // Fetch one extra row so we can tell whether the list was cut off.
  const docs = await User.find(query)
    .select("name email role isActive createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(MAX_ROWS + 1)
    .lean<UserDoc[]>();

  const truncated = docs.length > MAX_ROWS;

  const users: UserRow[] = docs.slice(0, MAX_ROWS).map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
  }));

  return { users, truncated };
}