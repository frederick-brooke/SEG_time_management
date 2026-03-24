import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERUSER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params
    const { type, durationDays, reportId } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID missing" },
        { status: 400 }
      );
    }

    // --- BAN LOGIC ---
    if (type === "TEMP") {
      if (!durationDays) {
        return NextResponse.json(
          { success: false, error: "durationDays required for TEMP ban" },
          { status: 400 }
        );
      }

      const expires = new Date();
      expires.setDate(expires.getDate() + durationDays);

      await prisma.user.update({
        where: { id },
        data: {
          isBanned: true,
          banExpires: expires,
        },
      });
    }

    if (type === "PERMANENT") {
      await prisma.user.update({
        where: { id },
        data: {
          isBanned: true,
          banExpires: null,
        },
      });
    }

    if (type === "UNBAN") {
      await prisma.user.update({
        where: { id },
        data: {
          isBanned: false,
          banExpires: null,
        },
      });
    }

    // --- REPORT UPDATE ---
    if (reportId) {
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: "RESOLVED",
          handledById: session.user.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (process.env.NODE_ENV !== "test") {
      console.error(e);
    }

    return NextResponse.json(
      { success: false, error: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}