import React from "react";
import { Button } from "@/components/ui/Button";
import { render, act, waitFor } from "@testing-library/react";
import { UnifiedMapLayer } from "@/components/map/UnifiedMapLayer";
import { MapEvent } from "@/lib/map";
import { SavedLocation } from "hooks/useSavedLocations";

// Leaflet mock

jest.mock("leaflet", () => {
  const polylineMock = {
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
  };
  const markerMock = {
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
  };
  return {
    __polylineMock: polylineMock,
    __markerMock: markerMock,
    polyline: jest.fn(() => polylineMock),
    marker: jest.fn(() => markerMock),
    divIcon: jest.fn((opts) => opts),
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const L = jest.requireMock("leaflet") as any;

const mockMap = {
  getZoom: jest.fn().mockReturnValue(12),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  fitBounds: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock("react-leaflet", () => ({
  useMap: () => mockMap,
}));

// @/lib/map mock 
jest.mock("@/lib/map", () => ({
  CATEGORY_COLORS: { Work: "#3b82f6", Personal: "#10b981" },
  TRANSPORT_ICONS: { CAR: "🚗", TRAIN: "🚆", WALK: "🚶" },
  formatDate: (d: string) => d,
  createPinSvg: (color: string, label: string) =>
    `<div style="color:${color}">${label}</div>`,
}));

// Fixtures
const baseEvent: MapEvent = {
  id: "evt-1",
  title: "Team standup",
  category: "Work",
  start: "2025-06-01T09:00:00Z",
  end: "2025-06-01T09:30:00Z",
  startCoords: { lat: 51.5, lng: -0.1 },
  destinationCoords: { lat: 51.51, lng: -0.09 },
  startLocationName: "Home",
  destLocationName: "Office",
  transportMode: "TRAIN",
  travelDuration: 20,
};

const homeLocation: SavedLocation = {
  id: "loc-1",
  type: "HOME",
  label: "Home",
  address: "1 Example Street, London",
  lat: 51.5,
  lng: -0.1,
};

const workLocation: SavedLocation = {
  id: "loc-2",
  type: "WORK",
  label: "Office",
  address: "10 Finsbury Square, London",
  lat: 51.52,
  lng: -0.08,
};

const favouriteLocation: SavedLocation = {
  id: "loc-3",
  type: "FAVOURITE",
  label: "Coffee shop",
  address: "3 Brew Lane, London",
  lat: 51.505,
  lng: -0.095,
};

// Helper
// Wraps render in act so React flushes the useEffect synchronously in jsdom.
async function renderLayer(
  events: MapEvent[] = [],
  savedLocations: SavedLocation[] = []
) {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <UnifiedMapLayer events={events} savedLocations={savedLocations} />
    );
  });
  return result;
}

// Tests
describe("UnifiedMapLayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMap.getZoom.mockReturnValue(12);
  });

  // Rendering
  describe("rendering", () => {
    it("renders without crashing when both props are empty", async () => {
      await expect(renderLayer()).resolves.toBeDefined();
    });

    it("returns null (no DOM nodes)", async () => {
      const { container } = await renderLayer([baseEvent], [homeLocation]);
      expect(container.firstChild).toBeNull();
    });
  });

  // Map lifecycle hooks
  describe("map lifecycle hooks", () => {
    it("registers a zoomend listener on mount", async () => {
      await renderLayer([baseEvent]);
      expect(mockMap.on).toHaveBeenCalledWith("zoomend", expect.any(Function));
    });

    it("removes the zoomend listener on unmount", async () => {
      const { unmount } = await renderLayer([baseEvent]);
      act(() => unmount());
      expect(mockMap.off).toHaveBeenCalledWith("zoomend", expect.any(Function));
    });

    it("removes all layers from the map on unmount", async () => {
      const { unmount } = await renderLayer([baseEvent]);
      // Confirm layers were added before unmounting
      await waitFor(() => expect(L.polyline).toHaveBeenCalled());
      act(() => unmount());
      expect(mockMap.removeLayer).toHaveBeenCalled();
    });
  });

  // Polylines
  describe("polylines", () => {
    it("draws a polyline between start and destination coords", async () => {
      await renderLayer([baseEvent]);
      await waitFor(() =>
        expect(L.polyline).toHaveBeenCalledWith(
          [
            [baseEvent.startCoords!.lat, baseEvent.startCoords!.lng],
            [baseEvent.destinationCoords!.lat, baseEvent.destinationCoords!.lng],
          ],
          expect.objectContaining({ dashArray: "8, 6" })
        )
      );
    });

    it("does not draw a polyline when an event has no destinationCoords", async () => {
      const partialEvent: MapEvent = { ...baseEvent, destinationCoords: undefined };
      await renderLayer([partialEvent]);
      expect(L.polyline).not.toHaveBeenCalled();
    });

    it("does not draw a polyline when an event has no startCoords", async () => {
      const partialEvent: MapEvent = { ...baseEvent, startCoords: undefined };
      await renderLayer([partialEvent]);
      expect(L.polyline).not.toHaveBeenCalled();
    });

    it("draws one polyline per qualifying event", async () => {
      const event2: MapEvent = {
        ...baseEvent,
        id: "evt-2",
        startCoords: { lat: 51.52, lng: -0.08 },
        destinationCoords: { lat: 51.53, lng: -0.07 },
      };
      await renderLayer([baseEvent, event2]);
      await waitFor(() => expect(L.polyline).toHaveBeenCalledTimes(2));
    });
  });

  // Markers
  describe("markers", () => {
    it("places a marker for each saved location", async () => {
      await renderLayer([], [homeLocation, workLocation]);
      await waitFor(() => expect(L.marker).toHaveBeenCalledTimes(2));
    });

    it("places markers for event start and destination (separate coords)", async () => {
      const farEvent: MapEvent = {
        ...baseEvent,
        startCoords: { lat: 51.0, lng: -0.1 },
        destinationCoords: { lat: 52.0, lng: -0.1 },
      };
      await renderLayer([farEvent], []);
      await waitFor(() => expect(L.marker).toHaveBeenCalledTimes(2));
    });

    it("clusters overlapping pins into a single marker", async () => {
      const collidingEvent: MapEvent = {
        ...baseEvent,
        startCoords: { lat: homeLocation.lat, lng: homeLocation.lng },
        destinationCoords: { lat: 52.0, lng: 0.5 },
      };
      await renderLayer([collidingEvent], [homeLocation]);
      // start + home cluster → 1 marker; far destination → 1 marker
      await waitFor(() => expect(L.marker).toHaveBeenCalledTimes(2));
    });

    it("binds a popup to every marker", async () => {
      await renderLayer([baseEvent], []);
      await waitFor(() => expect(L.marker).toHaveBeenCalled());
      L.marker.mock.results.forEach(({ value }: { value: typeof L.__markerMock }) => {
        expect(value.bindPopup).toHaveBeenCalled();
      });
    });
  });

  // fitBounds
  describe("fitBounds", () => {
    it("calls fitBounds on first render when there are multiple coords", async () => {
      await renderLayer([baseEvent]);
      await waitFor(() => expect(mockMap.fitBounds).toHaveBeenCalledTimes(1));
      expect(mockMap.fitBounds).toHaveBeenCalledWith(
        expect.arrayContaining([
          [baseEvent.startCoords!.lat, baseEvent.startCoords!.lng],
          [baseEvent.destinationCoords!.lat, baseEvent.destinationCoords!.lng],
        ]),
        expect.objectContaining({ padding: [40, 40] })
      );
    });

    it("does not call fitBounds when there is only one coordinate", async () => {
      const singleCoordEvent: MapEvent = { ...baseEvent, destinationCoords: undefined };
      await renderLayer([singleCoordEvent]);
      expect(mockMap.fitBounds).not.toHaveBeenCalled();
    });

    it("does not call fitBounds when there are no events", async () => {
      await renderLayer([], [homeLocation]);
      expect(mockMap.fitBounds).not.toHaveBeenCalled();
    });
  });

  // Saved-location pin icons
  describe("saved location pin icons", () => {
    it("creates a divIcon for a HOME saved location", async () => {
      await renderLayer([], [homeLocation]);
      await waitFor(() =>
        expect(L.divIcon).toHaveBeenCalledWith(
          expect.objectContaining({ html: expect.stringContaining("🏠") })
        )
      );
    });

    it("creates a divIcon for a WORK saved location", async () => {
      await renderLayer([], [workLocation]);
      await waitFor(() =>
        expect(L.divIcon).toHaveBeenCalledWith(
          expect.objectContaining({ html: expect.stringContaining("🏢") })
        )
      );
    });

    it("creates a divIcon for a FAVOURITE saved location", async () => {
      await renderLayer([], [favouriteLocation]);
      await waitFor(() =>
        expect(L.divIcon).toHaveBeenCalledWith(
          expect.objectContaining({ html: expect.stringContaining("⭐") })
        )
      );
    });
  });

  // Window events
  describe("window event listener", () => {
    it("registers saved-locations-updated on mount", async () => {
      const addSpy = jest.spyOn(window, "addEventListener");
      await renderLayer();
      expect(addSpy).toHaveBeenCalledWith(
        "saved-locations-updated",
        expect.any(Function)
      );
      addSpy.mockRestore();
    });

    it("removes saved-locations-updated on unmount", async () => {
      const removeSpy = jest.spyOn(window, "removeEventListener");
      const { unmount } = await renderLayer();
      act(() => unmount());
      expect(removeSpy).toHaveBeenCalledWith(
        "saved-locations-updated",
        expect.any(Function)
      );
      removeSpy.mockRestore();
    });
  });
});
