import { prisma } from "@/src/lib/prisma";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapEvent {
  id: string;
  title: string;
  category: string;
  start: string; 
  end: string;   
  startCoords: LatLng | null;
  destinationCoords: LatLng | null;
  startLocationName?: string;
  destLocationName?: string;
  travelDuration?: number;
  transportMode?: string;
}

/**
 * Fetches events for a user that have coordinates and maps them
 */
export async function getUserMapEvents(userId: string): Promise<MapEvent[]> {
  const events = await prisma.event.findMany({
    where: {
      userId,
      OR: [
        { startCoords: { not: null } },
        { destinationCoords: { not: null } },
      ],
    },
    orderBy: { start: "asc" },
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
    startCoords: validateCoords(e.startCoords),
    destinationCoords: validateCoords(e.destinationCoords),
    startLocationName: e.startLocationName ?? undefined,
    destLocationName: e.destLocationName ?? undefined,
    travelDuration: e.travelDuration ?? undefined,
    transportMode: e.transportMode ?? undefined,
  }));
}

/**
 * Validates that coordinates exist and are within valid ranges.
 * Returns null if invalid.
 */
function validateCoords(coords: any): LatLng | null {
  if (
    coords &&
    typeof coords.lat === "number" &&
    typeof coords.lng === "number" &&
    coords.lat >= -90 && coords.lat <= 90 &&
    coords.lng >= -180 && coords.lng <= 180
  ) {
    return { lat: coords.lat, lng: coords.lng };
  }
  return null;
}