import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function middleware(req) {
  const token = await getToken({ req });

  if (!token) return NextResponse.next();

  const user = await prisma.user.findUnique({
    where: { id: token.id },
  });

  if (user?.isBanned) {
    return NextResponse.redirect(
      new URL("/banned", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*"],
};