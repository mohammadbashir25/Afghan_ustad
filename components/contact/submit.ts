import type { ContactSubmitHandler } from "./types";

/** Sends the validated contact form to the server-side Resend endpoint. */
export const submitContactMessage: ContactSubmitHandler = async (values) => {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  const result = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(result.error || "Unable to send your message.");
};
