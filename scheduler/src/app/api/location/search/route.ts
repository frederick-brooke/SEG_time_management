export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) return Response.json([]);

  try {
    const baseParams = {
      api_key: process.env.OPENROUTE_API_KEY!,
      text: q,
      "focus.point.lon": "-1.5",
      "focus.point.lat": "52.5",
    };

    const [ukRes, globalRes] = await Promise.all([
      fetch(`https://api.openrouteservice.org/geocode/search?${new URLSearchParams({
        ...baseParams,
        size: "5",
        "boundary.country": "GBR",
      })}`),
      fetch(`https://api.openrouteservice.org/geocode/search?${new URLSearchParams({
        ...baseParams,
        size: "3",
      })}`),
    ]);

    const [ukData, globalData] = await Promise.all([
      ukRes.ok ? ukRes.json() : { features: [] },
      globalRes.ok ? globalRes.json() : { features: [] },
    ]);

    const mapFeature = (feature: any) => ({
      geometry: { coordinates: feature.geometry.coordinates },
      properties: {
        name: feature.properties.name || feature.properties.label || "Unknown",
        city: feature.properties.locality || feature.properties.county || "",
        display: feature.properties.label,
      },
    });

    const ukResults = (ukData.features || []).map(mapFeature);
    const globalResults = (globalData.features || []).map(mapFeature);

    const seen = new Set(ukResults.map((r: any) => r.properties.display));
    const dedupedGlobal = globalResults.filter(
      (r: any) => !seen.has(r.properties.display)
    );

    return Response.json([...ukResults, ...dedupedGlobal]);
  } catch (error) {
    console.error("Geocode server error:", error);
    return Response.json([]);
  }
}