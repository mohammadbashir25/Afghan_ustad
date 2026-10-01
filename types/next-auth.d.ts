import "next-auth";
import "next-auth/jwt";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "SUPER_ADMIN" | "MANAGER" | "GUIDE" | "STUDENT";
  }

  interface Session {
    user: {
      id: string;
      role: "SUPER_ADMIN" | "MANAGER" | "GUIDE" | "STUDENT";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "SUPER_ADMIN" | "MANAGER" | "GUIDE" | "STUDENT";
  }
}