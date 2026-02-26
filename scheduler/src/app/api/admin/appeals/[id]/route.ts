import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action } = await req.json(); // APPROVE or REJECT

  try {
    const appeal = await prisma.appeal.findUnique({
      where: { id },
    });

    if (!appeal) {
      return NextResponse.json(
        { success: false, error: "Appeal not found" },
        { status: 404 }
      );
    }

    // APPROVE → unban user
    if (action === "APPROVE") {
      await prisma.user.update({
        where: { id: appeal.userId },
        data: {
          isBanned: false,
          banExpires: null,
        },
      });

      await prisma.appeal.update({
        where: { id },
        data: { status: "APPROVED" },
      });
    }

    // REJECT → keep banned
    if (action === "REJECT") {
      await prisma.appeal.update({
        where: { id },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}