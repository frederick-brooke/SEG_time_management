import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPERUSER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await req.json(); // approve or reject

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

    // unbans the user if they were alredy banned
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
        data: { status: "APPROVED", handledById: session.user.id },
      });
    }

    // reject to keep them banned
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