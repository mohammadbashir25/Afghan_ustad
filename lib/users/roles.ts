/**
 * Shared role definitions and permission rules. Mirrors the union in
 * next-auth.d.ts and the enum in models/User.ts. Pure data, so it is safe to
 * import from both server and client code.
 */

export const USER_ROLES = ["SUPER_ADMIN", "MANAGER", "GUIDE", "TEACHER", "STAFF", "STUDENT"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  GUIDE: "Skill Center Guide",
  TEACHER: "Teacher",
  STAFF: "Other Staff",
  STUDENT: "Student",
};

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

/** Unprefixed dashboard each role lands on after signing in. */
export const DASHBOARD_HOME: Record<UserRole, string> = {
  SUPER_ADMIN: "/admin",
  MANAGER: "/manager",
  GUIDE: "/guide",
  TEACHER: "/teacher",
  STAFF: "/staff",
  STUDENT: "/student",
};

/**
 * Who may create whom.
 * SUPER_ADMIN cannot be created through the app.
 * MANAGER may register students through the dedicated registration workflow, but cannot create staff accounts.
 */
export const CREATABLE_ROLES: Record<UserRole, readonly UserRole[]> = {
  SUPER_ADMIN: ["MANAGER", "GUIDE", "TEACHER", "STAFF"],
  MANAGER: [],
  GUIDE: [],
  TEACHER: [],
  STAFF: [],
  STUDENT: [],
};

export function canCreateRole(actor: UserRole, target: UserRole): boolean {
  return CREATABLE_ROLES[actor].includes(target);
}