// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import { User } from "next-auth";

export async function authorizeUser(
  credentials: Record<string, string> | undefined,
  req: any
): Promise<User | null> {
  if (!credentials?.identifier || !credentials?.password) return null;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: credentials.identifier },
        { username: credentials.identifier }
      ]
    },
    include: { reportsReceived: true },
  });

  if (!user || !user.passwordHash) return null;

  const isValid = await verifyPassword(credentials.password, user.passwordHash);
  if (!isValid) return null;

  if (user.isBanned) {
    if (!user.banExpires || new Date() < user.banExpires) {
      return {
        id: user.id.toString(),
        email: user.email,
        name: user.username,
        role: user.role,
        isBanned: true,
        username: user.username,
        isDeleted: user.isDeleted,
      };
    }
    await prisma.user.update({ where: { id: user.id }, data: { isBanned: false, banExpires: null } });
    user.isBanned = false;
  }

  return {
    id: user.id.toString(),
    email: user.email,
    username: user.username,
    role: user.role,
    isBanned: user.isBanned,
    isDeleted: user.isDeleted,
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeUser,
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { role: true },
        });
        user.role = dbUser ? dbUser.role : "BASIC";
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.isBanned = user.isBanned;
        token.username = user.username;
        token.isDeleted = user.isDeleted;
      }

      if (!token.username && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { username: true },
        });
        token.username = dbUser?.username;
      }

      if (account?.access_token) {
        token.accessToken = account.access_token;
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
        token.role = user.role;
        token.isBanned = user.isBanned;
        return token;
      }

      if (!token.role && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.role = dbUser?.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.isBanned = token.isBanned as boolean;
        session.user.username = token.username;

        const googleAccount = await prisma.account.findFirst({
          where: { userId: token.sub, provider: "google" },
        });

        session.user.googleConnected = !!googleAccount;
      }

      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/dashboard",
  },
};