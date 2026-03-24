/**
 * GET /api/travel
 *
 * Calculates travel duration between two coordinates using a selected mode.
 *
 * Query parameters:
 *  - start: JSON stringified coordinates for the start location
 *  - dest: JSON stringified coordinates for the destination
 *  - mode: travel mode ("walking" | "cycling" | "driving"), defaults to "walking"
 *
 * Returns:
 *  - { duration: number | null } in seconds (or null if inputs are invalid or error occurs)
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateTravelTime } from "@/src/lib/travel";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Extract and validate query parameters 
  const mode = (searchParams.get("mode") || "walking") as "walking" | "cycling" | "driving";
  const startStr = searchParams.get("start");
  const destStr = searchParams.get("dest");

  // Return early if required coordinates are missing or invalid
  if (!startStr || !destStr || startStr === "null" || destStr === "null") {
    return NextResponse.json({ duration: null });
  }

  try {
    // Parse coordinates from JSON strings
    const start = JSON.parse(startStr);
    const dest = JSON.parse(destStr);

    console.log(`Calculating ${mode} time between`, start, dest);

    // Call helper to compute travel duration
    const duration = await calculateTravelTime(start, dest, mode);

    return NextResponse.json(
      { duration },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );

  } catch (error) {
    // Catch JSON parse errors or unexpected failures
    console.error("Error calculating travel time:", error);
    return NextResponse.json({ duration: null }, { status: 500 });
  }
}