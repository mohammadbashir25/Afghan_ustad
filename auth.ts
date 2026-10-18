import NextAuth from "next-auth";
import { createHash } from "node:crypto";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import LoginAttempt from "@/models/LoginAttempt";

const staffSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const studentSchema = z.object({
  studentId: z.string().trim().min(1).max(40),
  username: z.string().trim().toLowerCase().min(1).max(40),
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be 4 to 8 digits"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "Staff and student credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        studentId: { label: "Student ID", type: "text" },
        username: { label: "Username", type: "text" },
        pin: { label: "PIN", type: "password" },
      },

      async authorize(credentials, request) {
        const studentAttempt =
          typeof credentials?.studentId === "string" ||
          typeof credentials?.username === "string" ||
          typeof credentials?.pin === "string";

        await connectDB();
        const identity = studentAttempt
          ? `${String(credentials?.studentId || "").trim().toLowerCase()}|${String(credentials?.username || "").trim().toLowerCase()}`
          : String(credentials?.email || "").trim().toLowerCase();
        const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
        const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
        const attemptKey = createHash("sha256").update(`${ip}|${identity}`).digest("hex");
        const now = new Date();
        const previousAttempt = await LoginAttempt.findOne({ key: attemptKey }).lean();
        if (previousAttempt?.lockedUntil && new Date(previousAttempt.lockedUntil).getTime() > now.getTime()) return null;
        if (previousAttempt && now.getTime() - new Date(previousAttempt.windowStartedAt).getTime() > 15 * 60 * 1000) {
          await LoginAttempt.updateOne({ key: attemptKey }, { $set: { count: 0, windowStartedAt: now, lockedUntil: null } });
        }
        const failedLogin = async () => {
          const current = await LoginAttempt.findOne({ key: attemptKey });
          if (!current || now.getTime() - current.windowStartedAt.getTime() > 15 * 60 * 1000) {
            await LoginAttempt.updateOne({ key: attemptKey }, { $set: { count: 1, windowStartedAt: now, lockedUntil: null, expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) } }, { upsert: true });
            return;
          }
          const count = current.count + 1;
          await LoginAttempt.updateOne({ key: attemptKey }, { $set: { count, lockedUntil: count >= 8 ? new Date(now.getTime() + 15 * 60 * 1000) : null, expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) } });
        };
        const successfulLogin = async () => { await LoginAttempt.deleteOne({ key: attemptKey }); };

        if (studentAttempt) {
          const parsed = studentSchema.safeParse({
            studentId: credentials?.studentId,
            username: credentials?.username,
            pin: credentials?.pin,
          });
          if (!parsed.success) { await failedLogin(); return null; }

          const { studentId, username, pin } = parsed.data;
          const student = await User.findOne({
            studentId,
            username,
            role: "STUDENT",
            isActive: true,
          }).select("+pinHash");

          if (!student || !student.pinHash) { await failedLogin(); return null; }
          const pinMatches = await bcrypt.compare(pin, student.pinHash);
          if (!pinMatches) { await failedLogin(); return null; }
          await successfulLogin();

          return {
            id: student._id.toString(),
            name: student.name,
            email: student.email,
            role: student.role,
          };
        }

        const parsed = staffSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        });
        if (!parsed.success) { await failedLogin(); return null; }

        const { email, password } = parsed.data;
        const staff = await User.findOne({
          email: email.toLowerCase(),
          role: { $in: ["SUPER_ADMIN", "MANAGER", "GUIDE", "TEACHER", "STAFF"] },
        }).select("+password");

        if (!staff || !staff.isActive || !staff.password) { await failedLogin(); return null; }

        const passwordMatches = await bcrypt.compare(password, staff.password);
        if (!passwordMatches) { await failedLogin(); return null; }
        await successfulLogin();

        return {
          id: staff._id.toString(),
          name: staff.name,
          email: staff.email,
          role: staff.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role!;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: { strategy: "jwt" },
});
