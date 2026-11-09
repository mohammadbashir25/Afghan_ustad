import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import type { UserRole } from "./roles";

export type UserStatusFilter = "active" | "inactive";

export interface UserListFilters {
  query: string;
  role: UserRole | null;
  status: UserStatusFilter | null;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string | null;
}

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
  "OPERATIONS_MANAGER",
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
    role:
      filters.role && STAFF_ROLES.includes(filters.role)
        ? filters.role
        : { $in: STAFF_ROLES },
  };

  if (filters.status === "active") {
    query.isActive = { $ne: false };
  }

  if (filters.status === "inactive") {
    query.isActive = false;
  }

  const needle = filters.query.trim().slice(0, MAX_QUERY_LENGTH);

  if (needle) {
    const pattern = new RegExp(escapeRegExp(needle), "i");
    query.$or = [{ name: pattern }, { email: pattern }];
  }

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