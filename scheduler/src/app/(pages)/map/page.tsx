import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// UI components
import MapView from "@/components/MapView";
import { SavedLocationsPanel } from "@/components/map/SavedLocationsPanel";
import MapPageClient from "./MapPageClient";

// Server Component
export default async function MapPage() {
  // Fetch the current authenticated session
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) throw new Error("Not authenticated");

  const userId = session.user.id;

  // Fetch events from the database
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

  const eventsSerialized = events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
    startCoords: e.startCoords as { lat: number; lng: number } | null,
    destinationCoords:
      e.destinationCoords as { lat: number; lng: number } | null,
    startLocationName: e.startLocationName,
    destLocationName: e.destLocationName,
    travelDuration: e.travelDuration,
    transportMode: e.transportMode,
  }));

  // Fetch user's location data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      location: true,
      locationHidden: true,
    },
  });

  const userLocation = user?.location as { lat: number; lng: number } | null;

  // Render UI with client component
  return (
    <main className="container mx-auto p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Event Map</h1>
          <p className="text-sm text-gray-500 mt-1">
            View your event locations
          </p>
        </div>

        <a
          href="/dashboard"
          className="text-sm text-blue-600 font-semibold hover:underline"
        >
          ← Back to Dashboard
        </a>
      </div>

      <MapPageClient
        events={eventsSerialized}
        userLocation={userLocation}
        userLocationHidden={user?.locationHidden || false}
      />
    </main>
  );
}