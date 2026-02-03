import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const events = await prisma.event.findMany({
    where: { userId: session.user.id },
    orderBy: { start: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { title, description, start, end, allDay, category } = await req.json();

  const event = await prisma.event.create({
    data: {
      title,
      description,
      category: category || "Personal",
      start: new Date(start),
      end: new Date(end),
      allDay: allDay || false,
      userId: session.user.id,
    },
  });
  return NextResponse.json(event, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { id, title, description, start, end, allDay, category } = await req.json();

  const updatedEvent = await prisma.event.update({
    where: { id, userId: session.user.id },
    data: {
      title,
      description,
      category,
      start: new Date(start),
      end: new Date(end),
      allDay: allDay ?? false,
    },
  });
  return NextResponse.json(updatedEvent);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

  await prisma.event.delete({ where: { id, userId: session.user.id } });
  return NextResponse.json({ message: "Deleted" });
}