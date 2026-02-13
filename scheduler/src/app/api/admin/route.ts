// app/api/admin/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  // Debug: Check if cookies are being received
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log("All cookies:", allCookies.map(c => c.name));
  
  const nextAuthCookie = cookieStore.get("next-auth.session-token") || 
                         cookieStore.get("__Secure-next-auth.session-token");
  console.log("NextAuth cookie present:", !!nextAuthCookie);

  const session = await getServerSession(authOptions);

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

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "cretedAt";
  const order = searchParams.get("order") === "asc" ? "desc" : "desc";
  //by default it is given in descending order
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const totalUsers = await prisma.user.count({
    where: {
        username: {
            contains:search,
            mode: "insensitive",
        },
    },
  });


  const users = await prisma.user.findMany({
    where: {
        username: {
            contains: search,
            mode: "insensitive",
        },
    },
    orderBy: {
        [sortBy]: order,
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({ totalUsers, users, totalPages: Math.ceil(totalUsers/limit), });
}