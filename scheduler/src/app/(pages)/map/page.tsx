import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/src/lib/auth";
import MapView from "@/src/components/map/MapView";
import { SavedLocationsPanel } from "@/components/map/SavedLocationsPanel";
import { getUserMapEvents } from "@/src/lib/map/eventHelpers";

/**
 * Data Transfer Object for map events
 */
type MapEventDTO = {
  id: string;
  title: string;
  category: string | null;
  start: string;
  end: string;
  startCoords: { lat: number; lng: number } | null;
  destinationCoords: { lat: number; lng: number } | null;
  startLocationName: string | null;
  destLocationName: string | null;
  travelDuration: number | null;
  transportMode: string | null;
};

export default async function MapPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login"); 
  }

  let events: MapEventDTO[] = [];

  try {
    events = await getUserMapEvents(session.user.id);
  } catch (error) {
    console.error("Failed to load map events:", error);
  }

  return (
    <main className="container mx-auto p-6 lg:p-8">
      <Header count={events.length} />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <MapView events={events} />
        </div>

        <aside className="w-full lg:w-72 shrink-0">
          <SavedLocationsPanel />
        </aside>
      </div>
    </main>
  );
}

/**
 * Header component (separates UI responsibility)
 */
function Header({ count }: { count: number }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">Event Map</h1>
        <p className="text-sm text-gray-500 mt-1">
          Showing {count} event{count !== 1 ? "s" : ""} with locations
        </p>
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