import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color } = await req.json();
  if (!name || !color)
    return NextResponse.json(
      { error: "Name and color required" },
      { status: 400 },
    );

  const category = await prisma.category.create({
    data: { name, color, userId: session.user.id },
  });

  return NextResponse.json({ category });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, color } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const category = await prisma.category.update({
    where: { id },
    data: { name, color },
  });

  return NextResponse.json({ category });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Ensure at least one category always remains
  const count = await prisma.category.count({
    where: { userId: session.user.id },
  });
  if (count <= 1)
    return NextResponse.json(
      { error: "Cannot delete last category" },
      { status: 400 },
    );

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
