import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

//fetch all saved locations for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locations = await prisma.savedLocation.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { type: "asc" },
      { createdAt: "asc" },
    ],
  });

  return NextResponse.json(locations);
}

//save a new location
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { label, address, lat, lng, type } = body;

  if (!label || !address || lat == null || lng == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validTypes = ["HOME", "WORK", "FAVOURITE"];
  const locationType = validTypes.includes(type) ? type : "FAVOURITE";

  // Enforce one HOME and one WORK per user — replace if already exists
  if (locationType === "HOME" || locationType === "WORK") {
    await prisma.savedLocation.deleteMany({
      where: { userId: session.user.id, type: locationType },
    });
  }

  const saved = await prisma.savedLocation.create({
    data: {
      userId: session.user.id,
      label,
      address,
      lat,
      lng,
      type: locationType,
    },
  });

  return NextResponse.json(saved, { status: 201 });
}
