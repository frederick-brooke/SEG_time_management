import { NextRequest, NextResponse } from "next/server";
import { calculateTravelTime } from "@/src/lib/travel";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") || "walking") as "walking" | "cycling" | "driving" | "transit";
  const startStr = searchParams.get("start");
  const destStr = searchParams.get("dest");

  if (!startStr || !destStr || startStr === "null" || destStr === "null") {
    return NextResponse.json({ duration: null });
  }

  try {
    const start = JSON.parse(startStr);
    const dest = JSON.parse(destStr);

    console.log(`Calculating ${mode} time between`, start, dest);

    const duration = await calculateTravelTime(start, dest, mode);
    
    return NextResponse.json(
      { duration }, 
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    return NextResponse.json({ duration: null }, { status: 500 });
  }
}