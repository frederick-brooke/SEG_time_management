export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) return Response.json([]);

  try {
    const res = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${process.env.OPENROUTE_API_KEY}&text=${encodeURIComponent(q)}&size=5`
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("OpenRoute geocode failed:", text);
      return Response.json([]);
    }

    const data = await res.json();

    if (!data.features || !Array.isArray(data.features)) {
      return Response.json([]);
    }

    const results = data.features.map((feature: any) => ({
      geometry: {
        coordinates: feature.geometry.coordinates,
      },
      properties: {
        name:
          feature.properties.name ||
          feature.properties.label ||
          "Unknown",
        city: feature.properties.locality || "",
        display: feature.properties.label,
      },
    }));

    return Response.json(results);
  } catch (error) {
    console.error("Geocode server error:", error);
    return Response.json([]);
  }
}