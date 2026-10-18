import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Keep the diagnostic route available only during local development.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  }

  try {
    await connectDB();
    return NextResponse.json({ success: true, message: "MongoDB connected successfully." });
  } catch (error) {
    console.error("MongoDB connection check failed", error);
    return NextResponse.json({ success: false, message: "MongoDB connection failed." }, { status: 500 });
  }
}
