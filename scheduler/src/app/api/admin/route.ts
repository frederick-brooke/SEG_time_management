// app/api/admin/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  // Debug: Check if cookies are being received
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log("All cookies:", allCookies.map(c => c.name));
  
  const nextAuthCookie = cookieStore.get("next-auth.session-token") || 
                         cookieStore.get("__Secure-next-auth.session-token");
  console.log("NextAuth cookie present:", !!nextAuthCookie);

  const session = await getServerSession(authOptions);

  console.log("Full session:", JSON.stringify(session, null, 2));
  console.log("User:", session?.user);
  console.log("User role:", session?.user?.role);

  if (!session) {
    return NextResponse.json(
      { error: "No session found. Please log in." },
      { status: 401 }
    );
  }
  //change back to the SUPERUSER once added in
  //needs local key inside the env file to work
  if (session.user?.role !== "BASIC") {
    return NextResponse.json(
      { error: "Access denied. Superuser role required.", currentRole: session.user?.role },
      { status: 403 }
    );
  }

  const totalUsers = await prisma.user.count();
  const users = await prisma.user.findMany()

  return NextResponse.json({ totalUsers, users });
}