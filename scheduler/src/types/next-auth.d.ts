/**
 * NextAuth type augmentations for custom user fields, JWT claims, and session shape.
 * Extends default NextAuth types to support roles, bans, and Google integration state.
 */

import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

type Test = import("next-auth").Session;

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: "BASIC" | "SUPERUSER";
    isBanned: boolean;
    username: string;
    isDeleted: boolean;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "BASIC" | "SUPERUSER";
      isBanned: boolean;
      googleConnected?: boolean;
      username: string;
      isDeleted: boolean;
    } & DefaultSession["user"];

    accessToken?: string; 
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: "BASIC" | "SUPERUSER";
    isBanned?: boolean;
    accessToken?: string;
    username?: string; 
    isDeleted?: boolean;
  }
}