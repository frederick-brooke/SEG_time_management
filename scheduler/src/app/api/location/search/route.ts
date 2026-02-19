import { NextRequest, NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q) return new Response(JSON.stringify([]), { status: 200 });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
      {
        headers: {
          "User-Agent": "MyNextApp/1.0 (your@email.com)", 
          "Referer": "http://localhost:3000",        
        },
      }
    );

    if (!res.ok) {
      console.error("Nominatim error:", res.status, await res.text());
      return new Response(JSON.stringify([]), { status: res.status });
    }

    const data = await res.json();

  const features = data.map((item: any) => ({
    geometry: { coordinates: [parseFloat(item.lon), parseFloat(item.lat)] },
    properties: { 
      name: item.name || item.display_name.split(",")[0],
      city: item.address?.city || item.address?.town || item.address?.suburb || "",
      display: item.display_name,
    },
  }));

    return new Response(JSON.stringify(features), { status: 200 });
  } catch (err) {
    console.error("Server Nominatim fetch error:", err);
    return new Response(JSON.stringify([]), { status: 500 });
  }
}
