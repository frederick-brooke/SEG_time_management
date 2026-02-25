import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { description, reportId } = body;

    if (!description) {
      return NextResponse.json(
        { error: "Description required" },
        { status: 400 }
      );
    }

    await prisma.appeal.create({
        data: {
            description,
            user: {
            connect: { id: session.user.id }
            },
            report: {
            connect: { id: reportId}
            }
        }
    })

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Appeal error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}