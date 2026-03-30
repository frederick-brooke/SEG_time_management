/**
 * Travel time API route
 * Calculates duration between two coordinates using selected travel mode
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateTravelTime } from "@/lib/travel";

/**
 * GET /api/travel/preview
 *
 * Computes travel duration between a start and destination point.
 * Accepts coordinates as JSON strings and supports walking, cycling, and driving modes.
 * Returns null if inputs are missing or invalid.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
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