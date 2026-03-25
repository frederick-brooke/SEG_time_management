import { NextResponse } from "next/server";

// Types

type GeoFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    label?: string;
    locality?: string;
    county?: string;
  };
};

type MappedLocation = {
  geometry: { coordinates: [number, number] };
  properties: {
    name: string;
    city: string;
    display: string;
  };
};

type GeocodeResponse = { features: GeoFeature[] };

// Constants 

// Bias results toward the UK midlands — improves relevance for the app's
// primary user base without fully restricting to UK-only results.
const FOCUS_POINT = { lon: "-1.5", lat: "52.5" };
const GEOCODE_BASE_URL = "https://api.openrouteservice.org/geocode/search";

// Helpers 

function buildUrl(base: Record<string, string>, extra: Record<string, string>): string {
  return `${GEOCODE_BASE_URL}?${new URLSearchParams({ ...base, ...extra })}`;
}

function mapFeature(feature: GeoFeature): MappedLocation {
  return {
    geometry: { coordinates: feature.geometry.coordinates },
    properties: {
      name: feature.properties.name ?? feature.properties.label ?? "Unknown",
      city: feature.properties.locality ?? feature.properties.county ?? "",
      display: feature.properties.label ?? "",
    },
  };
}

function mapFeatures(features: GeoFeature[] = []): MappedLocation[] {
  return features.map(mapFeature);
}

// Keeps UK results prioritised and removes any global results that share
// a display label with an already-included UK result.
function removeDuplicates(primary: MappedLocation[], secondary: MappedLocation[]): MappedLocation[] {
  const seen = new Set(primary.map((r) => r.properties.display));
  return secondary.filter((r) => !seen.has(r.properties.display));
}

async function safeJson(res: Response): Promise<GeocodeResponse> {
  if (!res.ok) return { features: [] };
  try {
    return await res.json();
  } catch {
    return { features: [] };
  }
}

async function fetchGeocodeResults(
  baseParams: Record<string, string>
): Promise<[GeocodeResponse, GeocodeResponse]> {
  const [ukRes, globalRes] = await Promise.all([
    fetch(buildUrl(baseParams, { size: "5", "boundary.country": "GBR" })),
    fetch(buildUrl(baseParams, { size: "3" })),
  ]);
  return Promise.all([safeJson(ukRes), safeJson(globalRes)]);
}

// GET 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query?.trim()) return NextResponse.json([]);

    const baseParams = {
      api_key: process.env.OPENROUTE_API_KEY!,
      text: query,
      "focus.point.lon": FOCUS_POINT.lon,
      "focus.point.lat": FOCUS_POINT.lat,
    };

    const [ukData, globalData] = await fetchGeocodeResults(baseParams);
    const ukResults = mapFeatures(ukData.features);
    const globalResults = mapFeatures(globalData.features);
    const dedupedGlobal = removeDuplicates(ukResults, globalResults);

    return NextResponse.json([...ukResults, ...dedupedGlobal]);
  } catch (error: unknown) {
    console.error("Geocode server error:", error);
    return NextResponse.json([]);
  }
}
