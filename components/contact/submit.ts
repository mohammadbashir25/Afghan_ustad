/**
 * Default submit handler — a STUB.
 * ---------------------------------------------------------------------------
 * There is no backend yet, so this just waits and resolves so the success
 * state can be previewed. Replace the body with a real request (or pass your
 * own `onSubmit` to <ContactForm />). Throw an Error to show the error state.
 */
import type { ContactSubmitHandler } from "./types";

export const submitContactMessage: ContactSubmitHandler = async () => {
  // TODO: connect API, e.g. await fetch("/api/contact", { method: "POST", … })
  await new Promise((resolve) => setTimeout(resolve, 900));
};
