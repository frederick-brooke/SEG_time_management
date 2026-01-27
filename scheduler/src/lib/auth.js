import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { users, googleAccounts } from "@/lib/memoryStore";
import { verifyPassword } from "@/lib/password";

export const authOptions = {
  pages: {
    signIn: "/signin",
  },

  session: { strategy: "jwt" }, // no DB → JWT sessions

  providers: [
    Credentials({
      name: "Email & Password",
      async authorize(credentials) {
        const user = users.find(u => u.email === credentials.email);
        if (!user) return null;

        const ok = await verifyPassword(credentials.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email };
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
        googleAccounts.push({
          userId: user.id,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
        });
      }
      return true;
    },

    async session({ session, token }) {
      const connected = googleAccounts.some(
        a => a.userId === token.sub
      );
      session.user.id = token.sub;
      session.user.googleConnected = connected;
      return session;
    },
  },
};