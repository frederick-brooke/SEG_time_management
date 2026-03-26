import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Types 
type LocationType = "HOME" | "WORK" | "FAVOURITE";
type Handler = (req: NextRequest) => Promise<Response>;

// Constants

const VALID_TYPES: LocationType[] = ["HOME", "WORK", "FAVOURITE"];
const UNIQUE_TYPES: LocationType[] = ["HOME", "WORK"];

// Helpers 

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

function withErrorHandling(handler: Handler): Handler {
  return async (req) => {
    try {
      return await handler(req);
    } catch (error: unknown) {
      console.error(error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

function unauthorised() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function resolveLocationType(raw: unknown): LocationType {
  return VALID_TYPES.includes(raw as LocationType) ? (raw as LocationType) : "FAVOURITE";
}

function isValidBody(label: unknown, address: unknown, lat: unknown, lng: unknown) {
  return (
    typeof label === "string" && label.trim() !== "" &&
    typeof address === "string" && address.trim() !== "" &&
    lat != null &&
    lng != null
  );
}

async function removePreviousIfUnique(userId: string, type: LocationType) {
  if (!UNIQUE_TYPES.includes(type)) return;
  await prisma.savedLocation.deleteMany({ where: { userId, type } });
}

// GET 

export const GET = withErrorHandling(async () => {
  const userId = await requireUserId();
  if (!userId) return unauthorised();

  const locations = await prisma.savedLocation.findMany({
    where: { userId },
    orderBy: [
      { type: "asc" },      // group by type (HOME before WORK before FAVOURITE)
      { createdAt: "asc" }, // then oldest first within each group
    ],
  });

  return NextResponse.json(locations);
});

// POST 

export const POST = withErrorHandling(async (req) => {
  const userId = await requireUserId();
  if (!userId) return unauthorised();

  const { label, address, lat, lng, type } = await req.json();

  if (!isValidBody(label, address, lat, lng)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const locationType = resolveLocationType(type);
  await removePreviousIfUnique(userId, locationType);

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
});
