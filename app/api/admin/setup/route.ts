import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const setupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    await connectDB();

    const existingUser = await User.findOne({
      email: process.env.ADMIN_SETUP_EMAIL,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin setup has already been completed.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const parsed = setupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input.",
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this email already exists.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "Super Admin created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin setup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}