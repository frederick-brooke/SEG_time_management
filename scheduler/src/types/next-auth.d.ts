import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

type Test = import("next-auth").Session;

declare module "next-auth" {
  interface User {
    id: string;
    role: "BASIC" | "SUPERUSER";
    isBanned: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: "BASIC" | "SUPERUSER";
      isBanned: boolean;
      googleConnected?: boolean;
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
  }
}