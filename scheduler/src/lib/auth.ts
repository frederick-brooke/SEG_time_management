// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
  },

  providers: [
    // Credentials login
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        console.log("Authorize called", credentials?.email);

        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await verifyPassword(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        console.log("Login success", user.email);

        // Return only the required fields
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.username,
          role: user.role, 
        };
      },
    }),

    // Google login
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
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
    async signIn() {
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        return token;
      }

      // Subsequent requests
      if (!token.role && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });

        token.role = dbUser?.role;
      }

      // Handle Google account linking (optional)
      if (account?.provider === "google" && token.sub) {
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (existingAccount && existingAccount.userId !== token.sub) {
          throw new Error("GoogleAccountTaken");
        }

        // Only create or update account, role is already set in user object
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
            refresh_token_expires_in:
              account.refresh_token_expires_in as number,
          },
          create: {
            userId: token.sub,
            type: account.type,
            provider: "google",
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            scope: account.scope,
            token_type: account.token_type,
            id_token: account.id_token,
            refresh_token_expires_in:
              account.refresh_token_expires_in as number,
          },
        });
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as "BASIC" | "SUPERUSER";

        // Optional: track Google connection
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
