// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "BASIC" | "SUPERUSER";
      googleConnected?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "BASIC" | "SUPERUSER"; //matches what authorize returns
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "BASIC" | "SUPERUSER";
  }
}