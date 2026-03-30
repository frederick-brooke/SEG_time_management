/**
 * Map types
 *
 * Shared TypeScript definitions for map-related data
 * including coordinates, friends, events, and map modes.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Friend {
  id: string;
  username: string;
  name: string;
  city?: string;
  country?: string;
  location: LatLng | null;
  pfp?: string;
  equippedAvatar?: string;
}

export interface MapEvent {
  id: string;
  title: string;
  category: string;
  start: string;
  end: string;
  startCoords: LatLng | null;
  destinationCoords: LatLng | null;
  startLocationName?: string | null;
  destLocationName?: string | null;
  travelDuration?: number | null;
  transportMode?: string | null;
}

export type MapMode = "events" | "friends";
