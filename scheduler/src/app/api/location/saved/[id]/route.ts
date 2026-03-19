
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE 
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const location = await prisma.savedLocation.findUnique({
    where: { id },
  });

  if (!location || location.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.savedLocation.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

//rename a saved location
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const location = await prisma.savedLocation.findUnique({
    where: { id },
  });

  if (!location || location.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { label } = await req.json();
  if (!label?.trim()) {
    return NextResponse.json({ error: "Label required" }, { status: 400 });
  }

  const updated = await prisma.savedLocation.update({
    where: { id },
    data: { label: label.trim() },
  });

  return NextResponse.json(updated);
}

