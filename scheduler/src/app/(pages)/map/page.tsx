import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MapView from "@/components/map/MapView";
import { SavedLocationsPanel } from "@/components/map/SavedLocationsPanel";
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

  const events = await fetchUserEvents(session.user.id);
  const serialisedEvents = events.map(serialiseEvent);

  return (
    <main className="container mx-auto p-6 lg:p-8">
      <PageHeader count={serialisedEvents.length} />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <MapView events={serialisedEvents} />
        </div>
        <div className="w-full lg:w-72 shrink-0">
          <SavedLocationsPanel />
        </div>
      </div>
    </main>
  );
}

// Sub-components

function PageHeader({ count }: { count: number }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">Event Map</h1>
        <p className="text-sm text-gray-500 mt-1">{getEventCountLabel(count)}</p>
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
