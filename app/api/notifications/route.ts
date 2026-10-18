import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const [unreadCount, docs] = await Promise.all([
    Notification.countDocuments({ recipient: userId, readAt: null }),
    Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(8)
      .select("title message kind readAt createdAt")
      .lean(),
  ]);

  return NextResponse.json({
    unreadCount,
    notifications: docs.map((item) => ({
      id: String(item._id),
      title: item.title,
      message: item.message,
      kind: item.kind,
      read: Boolean(item.readAt),
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { id?: unknown; all?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await connectDB();
  const readAt = new Date();
  if (body.all === true) {
    await Notification.updateMany({ recipient: userId, readAt: null }, { $set: { readAt } });
  } else if (typeof body.id === "string" && /^[a-f\d]{24}$/i.test(body.id)) {
    await Notification.updateOne({ _id: body.id, recipient: userId, readAt: null }, { $set: { readAt } });
  } else {
    return NextResponse.json({ error: "A valid notification id or all=true is required" }, { status: 400 });
  }

  const unreadCount = await Notification.countDocuments({ recipient: userId, readAt: null });
  return NextResponse.json({ ok: true, unreadCount });
}
