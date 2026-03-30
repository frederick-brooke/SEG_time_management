/**
 * Saved Locations API
 *
 * GET: returns all saved locations for the authenticated user,
 * grouped by type and ordered by creation time.
 *
 * POST: creates a new saved location with validation and type rules.
 * Enforces uniqueness for HOME and WORK locations.
 *
 * Requires authentication for all routes.
 */

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

/**
 * Gets the authenticated user's ID from the current session.
 *
 * @returns {Promise<string | null>} The user ID if authenticated, otherwise null.
 */
async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

/**
 * Wraps a route handler with centralized error handling.
 * Catches unexpected errors and returns a 500 response.
 *
 * @param handler - The route handler to wrap
 * @returns A wrapped handler with try/catch error handling
 */
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

/**
 * Returns a standard 401 Unauthorized JSON response.
 *
 * @returns {NextResponse} Unauthorized response
 */
function unauthorised() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Normalizes and validates the incoming location type.
 * Falls back to "FAVOURITE" if the provided value is invalid.
 *
 * @param raw - Raw input value from request body
 * @returns A valid LocationType
 */
function resolveLocationType(raw: unknown): LocationType {
  return VALID_TYPES.includes(raw as LocationType) ? (raw as LocationType) : "FAVOURITE";
}

/**
 * Validates required fields for creating a saved location.
 *
 * @param label - Location label
 * @param address - Location address
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns True if all required fields are valid
 */
function isValidBody(label: unknown, address: unknown, lat: unknown, lng: unknown) {
  return (
    typeof label === "string" && label.trim() !== "" &&
    typeof address === "string" && address.trim() !== "" &&
    lat != null &&
    lng != null
  );
}

/**
 * Removes existing unique locations (HOME/WORK) before creating a new one.
 *
 * Ensures only one HOME and one WORK location exists per user.
 *
 * @param userId - The user's ID
 * @param type - Location type being inserted
 */
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
      { type: "asc" },
      { createdAt: "asc" },
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
