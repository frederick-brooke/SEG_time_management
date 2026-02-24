import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  // Read cookies from the request context
  const cookieStore = cookies();
  const nextAuthCookies = {
    __Secure_next_auth_session_token: cookieStore.get(
      "__Secure-next-auth.session-token"
    )?.value,
  };

  const session = await getServerSession(authOptions, {
    cookies: () => nextAuthCookies,
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const report = await prisma.report.findFirst({
    where: { reportedUserId: session.user.id, status: "RESOLVED" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    reason: report?.description ?? "Violation of community rules",
    expires: user?.banExpires,
  });
}