/**
 * Server-side validation for creating a user (zod 4).
 *
 * The role enum deliberately excludes SUPER_ADMIN. The action also checks
 * canCreateRole() against the signed-in user's role, so both layers must agree.
 */

import { z } from "zod";

import type { CreateUserField } from "./createUserState";

const CREATABLE_ROLE_VALUES = ["MANAGER", "GUIDE", "TEACHER", "STAFF"] as const;

export const createUserSchema = z
  .object({
    name: z
      .string()
      .min(2, "Enter the person's full name.")
      .max(100, "Name must be 100 characters or fewer."),
    email: z.email("Enter a valid email address.").max(254, "Email is too long."),
    role: z.enum(CREATABLE_ROLE_VALUES, { error: "Choose a role." }),
    salaryAmount: z.coerce.number().finite().min(0).max(100000000).default(0),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters.")
      .regex(/[A-Za-z]/, "Password must include a letter.")
      .regex(/\d/, "Password must include a number.")
      // bcrypt only uses the first 72 bytes, so reject longer input.
      .refine((value) => new TextEncoder().encode(value).length <= 72, "Password is too long."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;

const FIELDS: readonly CreateUserField[] = [
  "name",
  "email",
  "role",
  "password",
  "confirmPassword",
  "salaryAmount",
];

/** First error message per field, for display next to each input. */
export function collectFieldErrors(error: z.ZodError): Partial<Record<CreateUserField, string>> {
  const errors: Partial<Record<CreateUserField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    const field = FIELDS.find((candidate) => candidate === key);
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}