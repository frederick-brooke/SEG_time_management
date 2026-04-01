/**
 * Server Map page that fetches user events and location data,
 * then passes serialised props to the client Map UI.
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// UI components/ map
import MapPageClient from "./MapPageClient";
import type { Event } from "@prisma/client";


// Types 

type Coords = { lat: number; lng: number } | null;

export type SerialisedEvent = {
  id: string;
  title: string;
  category: string;
  start: string;
  end: string;
  startCoords: Coords;
  destinationCoords: Coords;
  startLocationName: string | null;
  destLocationName: string | null;
  travelDuration: number | null;
  transportMode: string | null;
};


// Data helpers 

async function fetchUserEvents(userId: string): Promise<Event[]> {
  return prisma.event.findMany({
    where: {
      userId,
      OR: [
        { startCoords: { not: null } },
        { destinationCoords: { not: null } },
      ],
    },
    orderBy: { start: "asc" },
  });
}

async function fetchUserLocationData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      location: true,
      locationHidden: true,
    },
  });

  return {
    userLocation: user?.location as { lat: number; lng: number } | null,
    userLocationHidden: user?.locationHidden || false,
  };
}

function serialiseEvent(event: Event): SerialisedEvent {
  return {
    id: event.id,
    title: event.title,
    category: event.category,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    startCoords: event.startCoords as Coords,
    destinationCoords: event.destinationCoords as Coords,
    startLocationName: event.startLocationName,
    destLocationName: event.destLocationName,
    travelDuration: event.travelDuration,
    transportMode: event.transportMode,
  };
}

function getEventCountLabel(count: number): string {
  return `Showing ${count} event${count !== 1 ? "s" : ""} with locations`;
}


// Page 

export default async function MapPage() {
  const session = await getServerSession(authOptions);

  if (!session) throw new Error("Not authenticated");

  const [events, locationData] = await Promise.all([
    fetchUserEvents(session.user.id),
    fetchUserLocationData(session.user.id),
  ]);

  const serialisedEvents = events.map(serialiseEvent);

  return (
    <main className="lunar-page">
      <PageHeader count={serialisedEvents.length} />
      <MapPageClient
        events={serialisedEvents}
        userLocation={locationData.userLocation}
        userLocationHidden={locationData.userLocationHidden}
      />
    </main>
  );
}


// Sub-components

function PageHeader({ count }: { count: number }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="lunar-page-title">Map</h1>
        <p className="lunar-page-subtitle">{getEventCountLabel(count)}</p>
      </div>
      <a
        href="/calendar"
        className="text-sm text-blue-600 font-semibold hover:underline"
      >
        ← Back to Calendar
      </a>
    </div>
  );
}