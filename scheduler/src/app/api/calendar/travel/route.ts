/**
 * API route for calculating travel time between two coordinates.
 * Wraps the getTravelTime utility and validates input before calling it.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTravelTime } from "@/lib/map";

/**
 * POST /api/travel-time
 * @param {NextRequest} req - Body: { start, end, mode? }
 * @returns {NextResponse} { duration } on success or { message } on failure
 */
export async function POST(req: NextRequest) {
  try {
    const { start, end, mode } = await req.json();

    if (
      start?.lat == null || start?.lng == null ||
      end?.lat == null || end?.lng == null
    ) {
      return NextResponse.json({ message: "Invalid coordinates" }, { status: 400 });
    }

    const duration = await getTravelTime(start, end, mode ?? "driving");
    return NextResponse.json({ duration });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "An unexpected error occurred";
    console.error("Travel route error:", e);
    return NextResponse.json({ message }, { status: 500 });
  }
}
