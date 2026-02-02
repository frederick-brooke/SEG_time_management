import type { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";

export const authOptions: AuthOptions = {
  pages: {
    signIn: "/login",
  },

  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Email & Password",
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
          user.passwordHash
        );
        if (!isValid) return null;

        return { id: user.id, email: user.email };
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user?.id) return false;
      }
      return true;
    },

    async jwt({ token, account }) {
      if (account?.provider === "google") {
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
          },
          create: {
            provider: "google",
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            userId: token.sub!,
          },
        });
      }
      return token;
    },

    async session({ session, token }) {
      const googleLinked = await prisma.account.findFirst({
        where: {
          userId: token.sub!,
          provider: "google",
        },
      });

      session.user.id = token.sub!;
      session.user.googleConnected = !!googleLinked;
      return session;
    },
  },
};