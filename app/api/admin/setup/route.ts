import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const setupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
});

function safeTokenMatch(received: string, expected: string) {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** One-time bootstrap endpoint. Requires a strong ADMIN_SETUP_TOKEN and exact ADMIN_SETUP_EMAIL. */
export async function POST(request: Request) {
  const setupToken = process.env.ADMIN_SETUP_TOKEN;
  const expectedEmail = process.env.ADMIN_SETUP_EMAIL?.trim().toLowerCase();
  const suppliedToken = request.headers.get("x-setup-token") ?? "";

  if (!setupToken || setupToken.length < 32 || !expectedEmail || !safeTokenMatch(suppliedToken, setupToken)) {
    return NextResponse.json({ success: false, message: "Setup is not authorized." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Provide a valid name, email, and a password of at least 12 characters." }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  if (email.toLowerCase() !== expectedEmail) {
    return NextResponse.json({ success: false, message: "The email is not authorized for initial setup." }, { status: 403 });
  }

  try {
    await connectDB();
    const existingAdmin = await User.findOne({ role: "SUPER_ADMIN" }).select("_id").lean();
    if (existingAdmin) {
      return NextResponse.json({ success: false, message: "A Super Admin already exists. Setup is closed." }, { status: 409 });
    }
    const existingEmail = await User.findOne({ email: email.toLowerCase() }).select("_id").lean();
    if (existingEmail) {
      return NextResponse.json({ success: false, message: "This email is already registered." }, { status: 409 });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 12),
      role: "SUPER_ADMIN",
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "Super Admin created successfully. Remove ADMIN_SETUP_TOKEN from the deployment environment now.",
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    }, { status: 201 });
  } catch (error) {
    console.error("Admin setup failed", error);
    return NextResponse.json({ success: false, message: "Setup failed. Check server logs." }, { status: 500 });
  }
}
