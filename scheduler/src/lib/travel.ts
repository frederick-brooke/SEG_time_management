import fetch from "node-fetch";

interface Coords {
  lat: number;
  lng: number;
}

interface GoogleDirectionsResponse {
  status: string;
  routes?: Array<{
    legs: Array<{
      duration: { value: number };
    }>;
  }>;
}

export async function calculateTravelTime(
  start: Coords | null,
  dest: Coords | null,
  mode: "walking" | "cycling" | "driving" | "transit" = "walking"
): Promise<number | null> {
  if (!start || !dest) return null;

  try {
    if (mode === "transit") {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) throw new Error("Missing GOOGLE_MAPS_API_KEY");

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${dest.lat},${dest.lng}&mode=transit&key=${apiKey}`;
      const res = await fetch(url);
      const data = (await res.json()) as GoogleDirectionsResponse;

      if (data.status !== "OK" || !data.routes?.length) return null;
      return Math.round(data.routes[0].legs[0].duration.value / 60);
    }

    const profileMap = {
      walking: "foot-walking",
      cycling: "cycling-regular",
      driving: "driving-car",
    };

    const profile = profileMap[mode];
    const apiKey = process.env.OPENROUTE_API_KEY;
    if (!apiKey) throw new Error("Missing OPENROUTE_API_KEY");

    const res = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${start.lng},${start.lat}&end=${dest.lng},${dest.lat}`,
      { headers: { Accept: "application/json, application/geo+json" } }
    );

    if (!res.ok) {
      console.error("ORS error:", res.status, await res.text());
      return null;
    }

    const data = await res.json() as any;

    if (!data.features?.length) return null;

    const seconds = data.features[0].properties.segments[0].duration;
    return Math.round(seconds / 60);

  } catch (err) {
    console.error("Travel time calculation error:", err);
    return null;
  }
}

