"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import { SavedLocationsPanel } from "@/components/map/SavedLocationsPanel";
import SetLocationModal from "@/components/map/SetLocationModal";

interface Event {
  id: string;
  title: string;
  category: string;
  start: string;
  end: string;
  startCoords: { lat: number; lng: number } | null;
  destinationCoords: { lat: number; lng: number } | null;
  startLocationName: string | null;
  destLocationName: string | null;
  travelDuration: number | null;
  transportMode: string;
}

interface MapPageClientProps {
  events: Event[];
  userLocation: { lat: number; lng: number } | null;
  userLocationHidden: boolean;
}

export default function MapPageClient({
  events,
  userLocation,
  userLocationHidden,
}: MapPageClientProps) {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <MapView events={events} />
        </div>
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <SavedLocationsPanel />
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            📍 Set Your Location
          </button>

          {/* Location Visibility Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  userLocationHidden ? "bg-red-400" : "bg-green-400"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-white">
                  {userLocationHidden
                    ? "Location hidden from friends"
                    : "Location visible to friends"}
                </p>
                <p className="text-xs text-white/50 mt-0.5">
                  {userLocationHidden
                    ? "Friends cannot see your location"
                    : "Friends can see your location"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Modal */}
      <SetLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        initialLocation={userLocation}
        initialHidden={userLocationHidden}
      />
    </>
  );
}
