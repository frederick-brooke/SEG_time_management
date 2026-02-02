import NextAuth from "next-auth";
import { authOptions } from "@/src/lib/auth"; // Imports from your master file

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };