"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { FiCheckCircle, FiPrinter } from "react-icons/fi";

import { createUserAction } from "@/app/admin/users/actions";
import {
  INITIAL_CREATE_USER_STATE,
  type CreateUserField,
  type CreateUserState,
} from "@/lib/users/createUserState";

export interface RoleOption {
  value: string;
  label: string;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]";

const FIELD =
  "h-10 w-full rounded-lg border border-[#DCE7E2] bg-white px-3 text-sm text-[#12372E] placeholder:text-[#64748B] aria-[invalid=true]:border-[#B42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-[#053B2E]"
      >
        {label}
      </label>

      {children}

      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-[#64748B]">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={`${id}-error`}
          className="mt-1 text-xs font-medium text-[#B42318]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function FormInner({
  roles,
  onAddAnother,
}: {
  roles: RoleOption[];
  onAddAnother: () => void;
}) {
  const [state, formAction, isPending] = useActionState<CreateUserState, FormData>(
    createUserAction,
    INITIAL_CREATE_USER_STATE,
  );

  // Kept in browser memory only; never stored in MongoDB by this component.
  const [temporaryPassword, setTemporaryPassword] = useState("");

  function printLoginDetails() {
    if (!temporaryPassword || !state.created) return;

    const printWindow = window.open("", "_blank", "width=600,height=700");

    if (!printWindow) {
      alert("Please allow pop-ups for this site to print login details.");
      return;
    }

    const email = escapeHtml(state.created.email);
    const password = escapeHtml(temporaryPassword);
    const loginUrl = escapeHtml(`${window.location.origin}/login`);
    const roleLabel = escapeHtml(state.created.roleLabel);

    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>AfghanUstad - Login Details</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #12372e;
              max-width: 560px;
              margin: 32px auto;
              padding: 24px;
              line-height: 1.5;
            }
            h1 {
              color: #0b6b4f;
              font-size: 24px;
              margin-bottom: 4px;
            }
            .subtitle {
              color: #64748b;
              margin-top: 0;
            }
            .field {
              border: 1px solid #dce7e2;
              border-radius: 8px;
              padding: 12px;
              margin: 14px 0;
              overflow-wrap: anywhere;
            }
            .label {
              display: block;
              font-size: 12px;
              font-weight: bold;
              color: #64748b;
              margin-bottom: 4px;
            }
            .value {
              font-size: 16px;
              font-weight: 600;
            }
            .notice {
              margin-top: 24px;
              font-size: 12px;
              color: #64748b;
            }
            @media print {
              body {
                margin: 0;
                padding: 12mm;
              }
            }
          </style>
        </head>
        <body>
          <h1>AfghanUstad</h1>
          <p class="subtitle">Student Login Details</p>

          <div class="field">
            <span class="label">Account type</span>
            <span class="value">${roleLabel}</span>
          </div>

          <div class="field">
            <span class="label">Email / Username</span>
            <span class="value">${email}</span>
          </div>

          <div class="field">
            <span class="label">Temporary password</span>
            <span class="value">${password}</span>
          </div>

          <div class="field">
            <span class="label">Login address</span>
            <span class="value">${loginUrl}</span>
          </div>

          <p class="notice">
            Keep these details private. Do not share them with other people.
            Sign in using the credentials above.
          </p>

          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  if (state.status === "success" && state.created) {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-4 rounded-xl border border-[#DCE7E2] bg-white p-6"
      >
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-[#E6F4EE] text-[#0B6B4F]"
        >
          <FiCheckCircle className="size-5" />
        </span>

        <div>
          <h3 className="text-base font-semibold text-[#053B2E]">
            User created successfully
          </h3>

          <p className="mt-1 text-sm text-[#64748B]">
            {state.created.email} was added as {state.created.roleLabel}.
          </p>

          {temporaryPassword ? (
            <p className="mt-2 text-sm text-[#12372E]">
              Print the login details now and give them securely to the new
              account holder.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#B42318]">
              The temporary password is unavailable for printing. You can
              create a new password through a password-reset workflow when
              that feature is available.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {temporaryPassword && (
            <button
              type="button"
              onClick={printLoginDetails}
              className={`inline-flex h-10 items-center gap-2 rounded-lg bg-[#0B6B4F] px-4 text-sm font-medium text-white transition-colors hover:bg-[#053B2E] ${FOCUS_RING}`}
            >
              <FiPrinter className="size-4" />
              Print Login Details
            </button>
          )}

          <button
            type="button"
            onClick={onAddAnother}
            className={`inline-flex h-10 items-center rounded-lg border border-[#0B6B4F] px-4 text-sm font-medium text-[#0B6B4F] transition-colors hover:bg-[#E6F4EE] ${FOCUS_RING}`}
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  const errors: Partial<Record<CreateUserField, string>> =
    state.fieldErrors ?? {};
  const values = state.values;

  const describedBy = (
    field: CreateUserField,
    hasHint = false,
  ): string | undefined =>
    errors[field]
      ? `${field}-error`
      : hasHint
        ? `${field}-hint`
        : undefined;

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        setTemporaryPassword(String(formData.get("password") ?? ""));
      }}
      className="max-w-xl space-y-5 rounded-xl border border-[#DCE7E2] bg-white p-6"
    >
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-lg border border-[#F4C430] bg-[#FFF4C2] px-3 py-2 text-sm text-[#12372E]"
        >
          {state.message}
        </p>
      )}

      <Field id="name" label="Full name" error={errors.name}>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          autoComplete="off"
          defaultValue={values?.name ?? ""}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy("name")}
          className={FIELD}
        />
      </Field>

      <Field id="email" label="Email" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="off"
          defaultValue={values?.email ?? ""}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy("email")}
          className={FIELD}
        />
      </Field>

      <Field id="salaryAmount" label="Monthly salary (AFN)" hint="Optional base salary for staff payroll. Fines and gifts are tracked separately in the account ledger.">
        <input id="salaryAmount" name="salaryAmount" type="number" min="0" step="0.01" defaultValue="0" className={FIELD} />
      </Field>

      <Field id="role" label="Role" error={errors.role}>
        <select
          id="role"
          name="role"
          required
          defaultValue={values?.role || roles[0]?.value || ""}
          aria-invalid={errors.role ? true : undefined}
          aria-describedby={describedBy("role")}
          className={FIELD}
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="password"
        label="Temporary password"
        error={errors.password}
        hint="At least 10 characters, with a letter and a number."
      >
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={describedBy("password", true)}
          className={FIELD}
        />
      </Field>

      <Field
        id="confirmPassword"
        label="Confirm password"
        error={errors.confirmPassword}
      >
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          aria-describedby={describedBy("confirmPassword")}
          className={FIELD}
        />
      </Field>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className={`inline-flex h-10 items-center rounded-lg bg-[#0B6B4F] px-4 text-sm font-medium text-white transition-colors hover:bg-[#053B2E] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
        >
          {isPending ? "Creating…" : "Create user"}
        </button>

        <Link
          href="/manager"
          className={`inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F3] hover:text-[#12372E] ${FOCUS_RING}`}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

export default function CreateUserForm({
  roles,
}: {
  roles: RoleOption[];
}) {
  const [formKey, setFormKey] = useState(0);

  return (
    <FormInner
      key={formKey}
      roles={roles}
      onAddAnother={() => setFormKey((key) => key + 1)}
    />
  );
}
