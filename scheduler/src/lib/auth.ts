import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      googleConnected: boolean;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await verifyPassword(
          credentials.password,
          user.passwordHash || "",
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      return true;
    },

async jwt({ token, user, account }) {
  if (user) {
    token.sub = user.id;
  }

  if (account?.provider === "google") {
    const userId = token.sub ?? user?.id; 
    
    if (userId) {
      const existingAccount = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: account.providerAccountId,
          },
        },
      });

      if (existingAccount && existingAccount.userId !== userId) {
        throw new Error("GoogleAccountTaken");
      }

      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: account.providerAccountId,
          },
        },
        update: {
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
          scope: account.scope,
          token_type: account.token_type,
          id_token: account.id_token,
          refresh_token_expires_in: account.refresh_token_expires_in as number,
        },
        create: {
          userId,  
          type: account.type,
          provider: "google",
          providerAccountId: account.providerAccountId,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
          scope: account.scope,
          token_type: account.token_type,
          id_token: account.id_token,
          refresh_token_expires_in: account.refresh_token_expires_in as number,
        },
      });
    }
  } else if (user) {
    token.id = user.id;
    token.email = user.email;
  }

  return token;
},

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;

        const googleAccount = await prisma.account.findFirst({
          where: { userId: token.sub, provider: "google" },
        });

        session.user.googleConnected = !!googleAccount;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/dashboard",
  },
};
