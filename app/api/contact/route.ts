import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  contact: z.string().trim().min(5).max(254),
  subject: z.enum(["courses", "enrollment", "skillCenter", "other"]),
  message: z.string().trim().min(10).max(1000),
});

const subjectLabels: Record<z.infer<typeof schema>["subject"], string> = {
  courses: "Courses",
  enrollment: "Enrollment",
  skillCenter: "Skill Center",
  other: "Other",
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL;
    if (!apiKey || !to || !from) {
      console.error("Contact email is not configured: set RESEND_API_KEY, CONTACT_TO_EMAIL, and CONTACT_FROM_EMAIL.");
      return NextResponse.json({ error: "Contact messages are temporarily unavailable. Please try again later." }, { status: 503 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Please check the form fields and try again." }, { status: 400 });
    const { name, contact, subject, message } = parsed.data;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: contact.includes("@") ? contact : undefined,
        subject: `AfghanUstad contact: ${subjectLabels[subject]}`,
        text: `New message from the AfghanUstad website\n\nName: ${name}\nContact: ${contact}\nSubject: ${subjectLabels[subject]}\n\nMessage:\n${message}`,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error("Resend email request failed", response.status, details.slice(0, 500));
      return NextResponse.json({ error: "We could not send your message right now. Please try again later." }, { status: 502 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Contact endpoint failed", error);
    return NextResponse.json({ error: "We could not send your message right now. Please try again later." }, { status: 500 });
  }
}
