import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// UI components
import MapView from "@/components/MapView";
import { SavedLocationsPanel } from "@/components/map/SavedLocationsPanel";

// Server Component
export default async function MapPage() {
  // Fetch the current authenticated session
  const session = await getServerSession(authOptions);

  // If no session exists, block access
  if (!session) throw new Error("Not authenticated");

  // Query events from the database
  const events = await prisma.event.findMany({
    where: {
      // Only fetch events belonging to the logged-in user
      userId: session.user.id,

      // Only include events that have at least one location
      OR: [
        { startCoords: { not: null } },
        { destinationCoords: { not: null } },
      ],
    },

    // Sort events by start time (earliest first)
    orderBy: { start: "asc" },
  });

  const serialised = events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    start: e.start.toISOString(),
    end: e.end.toISOString(),

    // Ensure coords are typed correctly or null
    startCoords: e.startCoords as { lat: number; lng: number } | null,
    destinationCoords:
      e.destinationCoords as { lat: number; lng: number } | null,

    startLocationName: e.startLocationName,
    destLocationName: e.destLocationName,
    travelDuration: e.travelDuration,
    transportMode: e.transportMode,
  }));

  // Render UI
  return (
    <main className="container mx-auto p-6 lg:p-8">
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          {/* Page title */}
          <h1 className="text-2xl font-bold">Event Map</h1>

          {/* Dynamic event count with singular/plural logic */}
          <p className="text-sm text-gray-500 mt-1">
            Showing {serialised.length} event
            {serialised.length !== 1 ? "s" : ""} with locations
          </p>
        </div>

        {/* Navigation link back to calendar */}
        <a
          href="/calendar"
          className="text-sm text-blue-600 font-semibold hover:underline"
        >
          ← Back to Calendar
        </a>
      </div>

      {/* Main layout: map + sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Map section */}
        <div className="flex-1 min-w-0">
          {/* Pass serialized events to MapView */}
          <MapView events={serialised} />
        </div>

        {/* Sidebar for saved locations */}
        <div className="w-full lg:w-72 shrink-0">
          <SavedLocationsPanel />
        </div>
      </div>
    </main>
  );
}