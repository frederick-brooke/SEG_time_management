/**
 * Middleware proxy for route protection and access control.
 *
 * - Bypasses auth checks for public/auth routes
 * - Redirects deleted users to /account-deleted
 * - Redirects banned users to /banned
 * - Restricts /admin routes to SUPERUSER role only
 * - Allows all other authenticated and non-authenticated access for matched routes
 */

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function proxy(req) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/banned")
  ) {
    return NextResponse.next();
  }

  if (token?.isDeleted) {
    return NextResponse.redirect(new URL("/account-deleted", req.url));
  }

  if (!token) return NextResponse.next();

  if (token.isBanned) {
    return NextResponse.redirect(
      new URL("/banned", req.url)
    );
  }

    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (!token || token.role !== "SUPERUSER") {
        return NextResponse.redirect(new URL("/unauthorised", req.url));
      }
    }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*"],
};