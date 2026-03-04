import { NextRequest, NextResponse } from "next/server";
import { getTravelTime } from "@/src/lib/map";

export async function POST(req: NextRequest) {
  try {
    const { start, end, mode } = await req.json();

    if (!start?.lat || !start?.lng || !end?.lat || !end?.lng) {
      return NextResponse.json({ message: "Invalid coordinates" }, { status: 400 });
    }

    const duration = await getTravelTime(start, end, mode ?? "driving");
    return NextResponse.json({ duration });
  } catch (e: any) {
    console.error("Travel route error:", e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
