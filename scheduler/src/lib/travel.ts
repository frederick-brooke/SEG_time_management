interface Coords {
  lat: number;
  lng: number;
}

const PROFILE_MAP = {
  walking: "foot-walking",
  cycling: "cycling-regular",
  driving: "driving-car",
} as const;

async function fetchTravelDuration(
  profile: string,
  start: Coords,
  dest: Coords,
  apiKey: string,
): Promise<number | null> {
  const res = await fetch(
    `https://api.openrouteservice.org/v2/directions/${profile}`,
    {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat],
          [dest.lng, dest.lat],
        ],
      }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    console.error("ORS error:", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as any;
  if (!data.routes?.length) return null;
  return Math.round(data.routes[0].summary.duration / 60);
}

export async function calculateTravelTime(
  start: Coords | null,
  dest: Coords | null,
  mode: "walking" | "cycling" | "driving",
): Promise<number | null> {
  if (!start || !dest) return null;
  const apiKey = process.env.OPENROUTE_API_KEY;
  if (!apiKey) throw new Error("Missing OPENROUTE_API_KEY");
  try {
    return await fetchTravelDuration(PROFILE_MAP[mode], start, dest, apiKey);
  } catch (err) {
    console.error("Travel time calculation error:", err);
    return null;
  }
}