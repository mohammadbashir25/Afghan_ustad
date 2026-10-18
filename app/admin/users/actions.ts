"use server";

import { randomInt } from "node:crypto";

/**
 * Create-user server action.
 *
 * A "use server" file may export ONLY async functions, so constants and types
 * live elsewhere (lib/users/createUserState.ts).
 *
 * Order of checks (each one stops the request):
 *  1. A valid session exists.
 *  2. Input passes zod validation.
 *  3. The signed-in role may create the requested role (canCreateRole).
 *  4. The email isn't already used (a unique-index race is also handled).
 *  5. The password is hashed with bcrypt before it touches the database.
 *
 * The response contains only the email and role label. The password and its
 * hash never leave the server, and passwords are never logged.
 */

import { Types } from "mongoose";
import { requireRole } from "@/lib/auth/requireRole";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import type { CreateUserState } from "@/lib/users/createUserState";
import { ROLE_LABELS, canCreateRole } from "@/lib/users/roles";
import { collectFieldErrors, createUserSchema } from "@/lib/users/validation";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

const BCRYPT_ROUNDS = 12;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createUserAction(
  _previous: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  // 1. Authentication
  const session = await auth();
  if (!session?.user) {
    return {
      status: "error",
      message: "Your session has expired. Please sign in again.",
    };
  }

  // Normalise before validating. The model also lowercases emails.
  const values = {
    name: text(formData, "name").trim(),
    email: text(formData, "email").trim().toLowerCase(),
    role: text(formData, "role"),
    salaryAmount: text(formData, "salaryAmount") || "0",
  };

  // 2. Validation
  const parsed = createUserSchema.safeParse({
    ...values,
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: collectFieldErrors(parsed.error),
      values,
    };
  }
  const input = parsed.data;

  // 3. Authorization: re-checked on the server, whatever the UI showed.
  if (!canCreateRole(session.user.role, input.role)) {
    return {
      status: "error",
      message: "You are not allowed to create this type of user.",
      values,
    };
  }

  try {
    await connectDB();

    // 4. Duplicate email
    const existing = await User.findOne({ email: input.email })
      .select("_id")
      .lean();
    if (existing) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: { email: "An account with this email already exists." },
        values,
      };
    }

    // 5. Hash, then insert
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    await User.create({
      name: input.name,
      email: input.email,
      password: passwordHash,
      role: input.role,
      salaryAmount: input.salaryAmount,
      isActive: true,
    });
  } catch (error) {
    // 11000 = duplicate key: two requests raced past the findOne check.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: { email: "An account with this email already exists." },
        values,
      };
    }
    // Log the error object only. The submitted data (including the password)
    // is deliberately not logged.
    console.error("createUserAction failed", error);
    return {
      status: "error",
      message: "Something went wrong. The user was not created.",
      values,
    };
  }

  revalidatePath("/admin/users");

  return {
    status: "success",
    created: { email: input.email, roleLabel: ROLE_LABELS[input.role] },
  };
}

export async function setStudentActiveAction(
  studentId: string,
  isActive: boolean,
): Promise<{ success: boolean; message: string }> {
  // Only authorized staff can change student account status.
  await requireRole(["SUPER_ADMIN", "MANAGER"]);

  if (
    typeof studentId !== "string" ||
    !Types.ObjectId.isValid(studentId) ||
    typeof isActive !== "boolean"
  ) {
    return { success: false, message: "Invalid student or status." };
  }

  try {
    await connectDB();

    const student = await User.findOne({
      _id: studentId,
      role: "STUDENT",
    }).select("_id isActive");

    if (!student) {
      return { success: false, message: "Student account not found." };
    }

    if (student.isActive === isActive) {
      return {
        success: true,
        message: `Student account is already ${isActive ? "active" : "inactive"}.`,
      };
    }

    student.isActive = isActive;
    await student.save();

    revalidatePath("/admin/students");
    revalidatePath("/admin/users");
    revalidatePath("/manager/students");

    return {
      success: true,
      message: `Student account ${isActive ? "activated" : "deactivated"} successfully.`,
    };
  } catch (error) {
    console.error("setStudentActiveAction failed", error);

    return {
      success: false,
      message: "Could not update the student account. Please try again.",
    };
  }
}

/** Reset a student's PIN and return it once to the authorized staff member. */
export async function resetStudentPinAction(
  studentId: string,
): Promise<{ success: boolean; message: string; pin?: string }> {
  await requireRole(["SUPER_ADMIN", "MANAGER"]);
  if (typeof studentId !== "string" || !Types.ObjectId.isValid(studentId)) {
    return { success: false, message: "Invalid student account." };
  }
  try {
    await connectDB();
    const student = await User.findOne({
      _id: studentId,
      role: "STUDENT",
      isActive: true,
    }).select("_id");
    if (!student)
      return { success: false, message: "Active student account not found." };
    const pin = randomInt(0, 100_000_000).toString().padStart(8, "0");
    student.set("pinHash", await bcrypt.hash(pin, BCRYPT_ROUNDS));
    await student.save();
    revalidatePath("/admin/students");
    revalidatePath("/manager/students");
    return {
      success: true,
      message:
        "New PIN generated. Share it privately; it will not be shown again after leaving this screen.",
      pin,
    };
  } catch (error) {
    console.error("resetStudentPinAction failed", error);
    return {
      success: false,
      message: "Could not reset the PIN. Please try again.",
    };
  }
}

export async function setStaffActiveAction(
  userId: string,
  isActive: boolean,
): Promise<{ success: boolean; message: string }> {
  const session = await requireRole(["SUPER_ADMIN"]);

  if (!Types.ObjectId.isValid(userId) || typeof isActive !== "boolean") {
    return { success: false, message: "Invalid account or status." };
  }

  try {
    await connectDB();

    const staff = await User.findOne({
      _id: userId,
      role: { $in: ["MANAGER", "GUIDE", "TEACHER", "STAFF"] },
    }).select("_id name role isActive");

    if (!staff) {
      return { success: false, message: "Staff account not found." };
    }

    if (staff.isActive === isActive) {
      return {
        success: true,
        message: `Account is already ${isActive ? "active" : "inactive"}.`,
      };
    }

    staff.isActive = isActive;
    await staff.save();

    await AuditLog.create({
      actor: session.user.id,
      actorName: session.user.name || session.user.email || "Super Admin",
      action: isActive
        ? "STAFF_ACCOUNT_ACTIVATED"
        : "STAFF_ACCOUNT_DEACTIVATED",
      targetType: "User",
      targetId: String(staff._id),
      details: `${staff.role} account status changed to ${isActive ? "active" : "inactive"}.`,
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      message: `Staff account ${isActive ? "activated" : "deactivated"}.`,
    };
  } catch (error) {
    console.error("setStaffActiveAction failed", error);
    return { success: false, message: "Could not update the staff account." };
  }
}

export async function resetStaffPasswordAction(
  userId: string,
): Promise<{ success: boolean; message: string; password?: string }> {
  const session = await requireRole(["SUPER_ADMIN"]);

  if (!Types.ObjectId.isValid(userId)) {
    return { success: false, message: "Invalid staff account." };
  }

  try {
    await connectDB();

    const staff = await User.findOne({
      _id: userId,
      role: { $in: ["MANAGER", "GUIDE", "TEACHER", "STAFF"] },
      isActive: true,
    }).select("_id name role");

    if (!staff) {
      return {
        success: false,
        message: "Active staff account not found.",
      };
    }

    // Generate a temporary password and return it only once to the Super Admin.
    const temporaryPassword = randomInt(10000000, 100000000).toString();

    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    await User.updateOne(
      { _id: staff._id, role: staff.role, isActive: true },
      { $set: { password: passwordHash } },
    );

    await AuditLog.create({
      actor: session.user.id,
      actorName: session.user.name || session.user.email || "Super Admin",
      action: "STAFF_PASSWORD_RESET",
      targetType: "User",
      targetId: String(staff._id),
      details: `Password reset for ${staff.role} account.`,
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "Temporary password generated. Copy and share it privately.",
      password: temporaryPassword,
    };
  } catch (error) {
    console.error("resetStaffPasswordAction failed", error);
    return {
      success: false,
      message: "Could not reset the staff password.",
    };
  }
}

export async function deleteStaffAccountAction(
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const session = await requireRole(["SUPER_ADMIN"]);

  if (!Types.ObjectId.isValid(userId)) {
    return { success: false, message: "Invalid staff account." };
  }

  if (userId === session.user.id) {
    return { success: false, message: "You cannot delete your own account." };
  }

  try {
    await connectDB();

    const staff = await User.findOne({
      _id: userId,
      role: { $in: ["MANAGER", "GUIDE", "TEACHER", "STAFF"] },
    }).select("_id name role").lean();

    if (!staff) {
      return { success: false, message: "Staff account not found." };
    }

    if (staff.role === "GUIDE" || staff.role === "TEACHER") {
      const ClassRecord = (await import("@/models/Class")).default;

      const assignedClasses = await ClassRecord.countDocuments({
        $or: [{ guide: staff._id }, { teacher: staff._id }],
      });

      if (assignedClasses > 0) {
        return {
          success: false,
          message: "This staff member is assigned to classes. Reassign those classes first, or deactivate the account instead.",
        };
      }
    }

    const [
      attendanceCount,
      performanceCount,
      adjustmentCount,
      reviewCount,
    ] = await Promise.all([
      (await import("@/models/StaffAttendance")).default.countDocuments({
        staff: staff._id,
      }),
      (await import("@/models/StaffPerformance")).default.countDocuments({
        staff: staff._id,
      }),
      (await import("@/models/StaffAdjustment")).default.countDocuments({
        staff: staff._id,
      }),
      staff.role === "GUIDE"
        ? (await import("@/models/GuideReview")).default.countDocuments({
            guide: staff._id,
          })
        : Promise.resolve(0),
    ]);

    if (
      attendanceCount > 0 ||
      performanceCount > 0 ||
      adjustmentCount > 0 ||
      reviewCount > 0
    ) {
      return {
        success: false,
        message: "This account has attendance, performance, salary adjustment, or review history. Deactivate it to preserve those records.",
      };
    }

    if (staff.role === "MANAGER") {
      const activeSuperAdmins = await User.countDocuments({
        role: "SUPER_ADMIN",
        isActive: true,
      });

      if (activeSuperAdmins < 1) {
        return {
          success: false,
          message: "At least one active Super Admin must remain.",
        };
      }
    }

    await User.deleteOne({
      _id: staff._id,
      role: staff.role,
    });

    await AuditLog.create({
      actor: session.user.id,
      actorName: session.user.name || session.user.email || "Super Admin",
      action: "STAFF_ACCOUNT_DELETED",
      targetType: "User",
      targetId: String(staff._id),
      details: `Deleted ${staff.role} account for ${staff.name}.`,
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/attendance");
    revalidatePath("/manager/guides");

    return { success: true, message: "Staff account deleted." };
  } catch (error) {
    console.error("deleteStaffAccountAction failed", error);
    return {
      success: false,
      message: "Could not delete the staff account. Check related records.",
    };
  }
}

