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
          user.passwordHash || ""
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
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
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
      // If we are in the Google Auth Flow
      if (account?.provider === "google") {
        
        // If token.sub exists, the user is logged in and trying to link account
        if (token.sub) {
            await prisma.account.upsert({
                where: {
                    provider_providerAccountId: {
                        provider: "google",
                        providerAccountId: account.providerAccountId
                    }
                },
                update: {
                    access_token: account.access_token,
                    refresh_token: account.refresh_token,
                    expires_at: account.expires_at,
                    scope: account.scope,
                    token_type: account.token_type,
                    id_token: account.id_token,
                    // Add this:
                    refresh_token_expires_in: account.refresh_token_expires_in as number,
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
                    // Add this:
                    refresh_token_expires_in: account.refresh_token_expires_in as number,
                }
            });
        }
      } 
      // If this is a normal Email/Password login
      else if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        
        // Check if Google is linked
        const googleAccount = await prisma.account.findFirst({
            where: { userId: token.sub, provider: "google" }
        });
        
        session.user.googleConnected = !!googleAccount;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};