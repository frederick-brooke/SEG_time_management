
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


// Helpers 
// Centralised auth check to avoid duplication across handlers
async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}


// GET: fetch all saved locations for current user 

export async function GET() {
  try {
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch only the user's locations, ordered for predictable UI display
    const locations = await prisma.savedLocation.findMany({
      where: { userId },
      orderBy: [
        { type: "asc" },       // group by type (HOME, WORK, etc.)
        { createdAt: "asc" },  // then sort chronologically
      ],
    });

    return NextResponse.json(locations);

  } catch (error) {
    // Catch unexpected failures to avoid leaking internal errors
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


// POST: create a new saved location 

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { label, address, lat, lng, type } = await req.json();

    // Validate required fields 
    if (!label?.trim() || !address?.trim() || lat == null || lng == null) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    // Restrict type to known values 
    const validTypes = ["HOME", "WORK", "FAVOURITE"] as const;
    const locationType = validTypes.includes(type) ? type : "FAVOURITE";

    // A user can only have one HOME and one WORK location
    if (locationType === "HOME" || locationType === "WORK") {
      await prisma.savedLocation.deleteMany({
        where: { userId, type: locationType },
      });
    }

    // Create new saved location
    const saved = await prisma.savedLocation.create({
      data: {
        userId,
        label: label.trim(),     
        address: address.trim(),
        lat,
        lng,
        type: locationType,
      },
    });

    return NextResponse.json(saved, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}