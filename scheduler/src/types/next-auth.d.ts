import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

type Test = import("next-auth").Session;

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: "BASIC" | "SUPERUSER";
    isBanned: boolean;
    username: string;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "BASIC" | "SUPERUSER";
      isBanned: boolean;
      googleConnected?: boolean;
      username: string;
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
  }
}