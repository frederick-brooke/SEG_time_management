import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { users, googleAccounts } from "lib/memoryStore";
import { verifyPassword } from "lib/password";

export const authOptions = {
  pages: { signIn: "/login" },

  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Email & Password",

      // IMPORTANT: tells NextAuth what fields exist
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = users.find((u) => u.email === email);
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
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
      // TEMP (no DB): store google tokens in memory
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
      const connected = googleAccounts.some((a) => a.userId === token.sub);
      session.user.id = token.sub;
      session.user.googleConnected = connected;
      return session;
    },
  },
};