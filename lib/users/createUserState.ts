/**
 * Types and initial state for the create-user form. Kept free of zod and
 * server code so the client form can import it without bundling either.
 */

export type CreateUserField = "name" | "email" | "role" | "password" | "confirmPassword" | "salaryAmount";

export interface CreateUserState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<CreateUserField, string>>;
  /** Echoed back so the form keeps what was typed. Passwords are never echoed. */
  values?: { name: string; email: string; role: string };
  /** Set on success so the confirmation can name the new account. */
  created?: { email: string; roleLabel: string };
}

export const INITIAL_CREATE_USER_STATE: CreateUserState = { status: "idle" };