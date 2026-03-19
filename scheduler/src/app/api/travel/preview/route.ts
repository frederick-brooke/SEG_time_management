import { NextRequest, NextResponse } from "next/server";
import { calculateTravelTime } from "@/src/lib/travel";

/**
 * Supported transport modes
 */
const VALID_MODES = ["walking", "cycling", "driving"] as const;
type Mode = typeof VALID_MODES[number];

/**
 * Validate transport mode
 */
function parseMode(mode: string | null): Mode {
  if (mode && VALID_MODES.includes(mode as Mode)) {
    return mode as Mode;
  }
  return "walking"; // default fallback
}

/**
 * Validate coordinates structure
 */
function isValidCoords(obj: any): obj is { lat: number; lng: number } {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.lat === "number" &&
    typeof obj.lng === "number"
  );
}

/**
 * Safely parse coordinates from query param
 */
function parseCoords(str: string | null) {
  if (!str || str === "null") return null;

  try {
    const parsed = JSON.parse(str);
    return isValidCoords(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = parseMode(searchParams.get("mode"));
  const start = parseCoords(searchParams.get("start"));
  const dest = parseCoords(searchParams.get("dest"));

  // Validate required inputs
  if (!start || !dest) {
    return NextResponse.json(
      { error: "Invalid or missing coordinates" },
      { status: 400 }
    );
  }

  try {
    const duration = await calculateTravelTime(start, dest, mode);

    return NextResponse.json(
      { duration },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Travel time calculation failed:", error);

    return NextResponse.json(
      { error: "Failed to calculate travel time" },
      { status: 500 }
    );
  }
}