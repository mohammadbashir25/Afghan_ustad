/**
 * Super Admin: Add User (Server Component).
 *
 * Re-checks the SUPER_ADMIN role itself. The role options come from
 * CREATABLE_ROLES, so SUPER_ADMIN is never offered. The real enforcement is in
 * createUserAction, not in this list.
 */

import type { Metadata } from "next";

import DashboardPageHeader from "@/components/dashboard/Layout/DashboardPageHeader";
import CreateUserForm from "@/components/dashboard/users/CreateUserForm";
import { requireRole } from "@/lib/auth/requireRole";
import { CREATABLE_ROLES, ROLE_LABELS } from "@/lib/users/roles";

export const metadata: Metadata = {
  title: "Add user",
};

export default async function AdminNewUserPage() {
  const session = await requireRole(["SUPER_ADMIN"]);

  const roles = CREATABLE_ROLES[session.user.role].map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
  }));

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="People"
        title="Add User"
        description="Create Manager, Skill Center Guide, Teacher, or Other Staff accounts. Student registration and course payment are handled by the Manager."
      />
      <CreateUserForm roles={roles} />
    </div>
  );
}