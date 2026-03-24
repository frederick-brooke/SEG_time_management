import { NextResponse } from "next/server";

// GET: geocode search endpoint using OpenRouteService
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    // Return early for empty queries to avoid unnecessary API calls
    if (!query?.trim()) return NextResponse.json([]);

    // Shared parameters for both UK and global searches
    const baseParams = {
      api_key: process.env.OPENROUTE_API_KEY!,
      text: query,
      // Bias results toward UK (improves relevance for your app context)
      "focus.point.lon": "-1.5",
      "focus.point.lat": "52.5",
    };

    const [ukData, globalData] = await fetchGeocodeResults(baseParams);
    const ukResults = mapFeatures(ukData.features);
    const globalResults = mapFeatures(globalData.features);

    // Remove duplicates (same display label) to avoid repeated suggestions
    const dedupedGlobal = removeDuplicates(ukResults, globalResults);

    return NextResponse.json([...ukResults, ...dedupedGlobal]);

  } catch (error) {
    console.error("Geocode server error:", error);
    return NextResponse.json([]);
  }
}

// Helpers 

// Fetch UK and global geocode results concurrently
async function fetchGeocodeResults(baseParams: Record<string, string>) {
  const [ukRes, globalRes] = await Promise.all([
    fetch(buildUrl(baseParams, { size: "5", "boundary.country": "GBR" })),
    fetch(buildUrl(baseParams, { size: "3" })),
  ]);

  const [ukData, globalData] = await Promise.all([
    ukRes.ok ? ukRes.json() : { features: [] },
    globalRes.ok ? globalRes.json() : { features: [] },
  ]);

  return [ukData, globalData];
}


// Avoids duplication
function buildUrl(
  base: Record<string, string>,
  extra: Record<string, string>
) {
  return `https://api.openrouteservice.org/geocode/search?${new URLSearchParams({
    ...base,
    ...extra,
  })}`;
}

// Map external API response into a simplified, consistent structure
function mapFeatures(features: any[] = []) {
  return features.map((feature) => ({
    geometry: { coordinates: feature.geometry.coordinates },
    properties: {
      name: feature.properties.name || feature.properties.label || "Unknown",
      city: feature.properties.locality || feature.properties.county || "",
      display: feature.properties.label,
    },
  }));
}

// Remove duplicate results based on display label
// Keeps UK results prioritised and filters global overlaps
function removeDuplicates(primary: any[], secondary: any[]) {
  const seen = new Set(primary.map((r) => r.properties.display));
  return secondary.filter((r) => !seen.has(r.properties.display));
}