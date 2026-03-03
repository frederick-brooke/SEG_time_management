import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import MapView from "@/src/components/MapView";

export default async function MapPage() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Not authenticated");

  const events = await prisma.event.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { startCoords: { not: null } },
        { destinationCoords: { not: null } },
      ],
    },
    orderBy: { start: "asc" },
  });

  const serialized = events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
    startCoords: e.startCoords as { lat: number; lng: number } | null,
    destinationCoords: e.destinationCoords as { lat: number; lng: number } | null,
    startLocationName: e.startLocationName,
    destLocationName: e.destLocationName,
    travelDuration: e.travelDuration,
    transportMode: e.transportMode,
  }));

  return (
    <main className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Event Map</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {serialized.length} event{serialized.length !== 1 ? "s" : ""} with locations
          </p>
        </div>
        <a
          href="/calendar"
          className="text-sm text-blue-600 font-semibold hover:underline"
        >
          ← Back to Calendar
        </a>
      </div>

      <MapView events={serialized} />
    </main>
  );
}
