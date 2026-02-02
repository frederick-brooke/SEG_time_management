import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email/password login
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;

        return { id: user.id.toString(), email: user.email };
      },
    }),

    // Google provider used **only for linking**
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // allows linking to existing account
    }),
  ],

  pages: {
    signIn: "/login", // email/password login page
  },

  callbacks: {
    async signIn({ user, account }) {
        if (account?.provider === "google") {
        // Only allow sign-in if the user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
        });
        return !!existingUser; // reject if user does not exist
        }
        return true; // email/password sign-ins are always allowed
    },

    async jwt({ token, account }) {
        // Only link Google account if account exists (no auto-creation)
        if (account?.provider === "google") {
        // Check if user already has a linked Google account
        const existingAccount = await prisma.account.findUnique({
            where: {
            provider_providerAccountId: {
                provider: "google",
                providerAccountId: account.providerAccountId,
            },
            },
        });

        if (!existingAccount) {
            // Only create a link if token.sub exists (logged in email/password user)
            if (!token.sub) throw new Error("No user to link Google to");

            await prisma.account.create({
            data: {
                provider: "google",
                providerAccountId: account.providerAccountId,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                expiresAt: account.expires_at,
                userId: token.sub, // link to logged-in user
            },
            });
        }
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

        session.user = {
        id: token.sub!,
        email: session.user?.email || "",
        googleConnected: !!googleLinked,
        };

        return session;
    },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };