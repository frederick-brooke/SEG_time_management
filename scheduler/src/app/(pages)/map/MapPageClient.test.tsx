import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MapPageClient from "./MapPageClient";

// --- Mocks ---

jest.mock("@/components/map/MapView", () => ({
  __esModule: true,
  default: ({ events, userLocation }: { events: unknown[]; userLocation: unknown }) => (
    <div
      data-testid="map-view"
      data-events={JSON.stringify(events)}
      data-user-location={JSON.stringify(userLocation)}
    />
  ),
}));

jest.mock("@/components/map/SavedLocationsPanel", () => ({
  SavedLocationsPanel: () => <div data-testid="saved-locations-panel" />,
}));

jest.mock("@/components/map/SetLocationModal", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onClose,
    initialLocation,
    initialHidden,
  }: {
    isOpen: boolean;
    onClose: () => void;
    initialLocation: unknown;
    initialHidden: boolean;
  }) => (
    <div
      data-testid="set-location-modal"
      data-is-open={String(isOpen)}
      data-initial-hidden={String(initialHidden)}
      data-initial-location={JSON.stringify(initialLocation)}
    >
      {isOpen && (
        <button data-testid="modal-close-btn" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  ),
}));

// --- Fixtures ---

const mockEvents = [
  {
    id: "1",
    title: "Team Standup",
    category: "work",
    start: "2024-06-10T09:00:00",
    end: "2024-06-10T09:30:00",
    startCoords: { lat: 51.5074, lng: -0.1278 },
    destinationCoords: { lat: 51.515, lng: -0.09 },
    startLocationName: "Home",
    destLocationName: "Office",
    travelDuration: 20,
    transportMode: "transit",
  },
  {
    id: "2",
    title: "Lunch",
    category: "personal",
    start: "2024-06-10T12:00:00",
    end: "2024-06-10T13:00:00",
    startCoords: null,
    destinationCoords: null,
    startLocationName: null,
    destLocationName: null,
    travelDuration: null,
    transportMode: "walking",
  },
];

const mockUserLocation = { lat: 51.5074, lng: -0.1278 };

//Test Helper

const defaultProps = {
  events: mockEvents,
  userLocation: mockUserLocation,
  userLocationHidden: false,
};

const renderMapPage = (overrideProps = {}) => {
  return render(<MapPageClient {...defaultProps} {...overrideProps} />);
};

//  Tests 

describe("MapPageClient", () => {
  describe("Rendering", () => {
    it("renders MapView with correct props", () => {
      renderMapPage();

      const mapView = screen.getByTestId("map-view");
      expect(mapView).toBeInTheDocument();
      expect(JSON.parse(mapView.getAttribute("data-events") || "[]")).toEqual(mockEvents);
      expect(JSON.parse(mapView.getAttribute("data-user-location") || "null")).toEqual(mockUserLocation);
    });

    it("renders SavedLocationsPanel", () => {
      renderMapPage();

      expect(screen.getByTestId("saved-locations-panel")).toBeInTheDocument();
    });

    it("renders the Set Your Location button", () => {
      renderMapPage();

      expect(screen.getByRole("button", { name: /set your location/i })).toBeInTheDocument();
    });

    it("renders SetLocationModal (initially closed)", () => {
      renderMapPage();

      const modal = screen.getByTestId("set-location-modal");
      expect(modal).toBeInTheDocument();
      expect(modal.getAttribute("data-is-open")).toBe("false");
    });
  });

  describe("Location Visibility Indicator", () => {
    it("shows 'Location visible to friends' when userLocationHidden is false", () => {
      renderMapPage();

      expect(screen.getByText("Location visible to friends")).toBeInTheDocument();
      expect(screen.getByText("Friends can see your location")).toBeInTheDocument();
    });

    it("shows 'Location hidden from friends' when userLocationHidden is true", () => {
      renderMapPage({ userLocationHidden: true });

      expect(screen.getByText("Location hidden from friends")).toBeInTheDocument();
      expect(screen.getByText("Friends cannot see your location")).toBeInTheDocument();
    });

    it("applies green indicator dot when location is visible", () => {
      const { container } = renderMapPage();

      const dot = container.querySelector(".bg-green-400");
      expect(dot).toBeInTheDocument();
    });

    it("applies red indicator dot when location is hidden", () => {
      const { container } = renderMapPage({ userLocationHidden: true });

      const dot = container.querySelector(".bg-red-400");
      expect(dot).toBeInTheDocument();
    });
  });

  describe("Set Location Modal – open/close", () => {
    it("opens the modal when the Set Your Location button is clicked", () => {
      renderMapPage();

      fireEvent.click(screen.getByRole("button", { name: /set your location/i }));

      const modal = screen.getByTestId("set-location-modal");
      expect(modal.getAttribute("data-is-open")).toBe("true");
    });

    it("closes the modal when onClose is called", () => {
      renderMapPage();

      fireEvent.click(screen.getByRole("button", { name: /set your location/i }));
      expect(screen.getByTestId("set-location-modal").getAttribute("data-is-open")).toBe("true");

      fireEvent.click(screen.getByTestId("modal-close-btn"));
      expect(screen.getByTestId("set-location-modal").getAttribute("data-is-open")).toBe("false");
    });

    it("passes initialLocation to modal", () => {
      renderMapPage();

      const modal = screen.getByTestId("set-location-modal");
      expect(JSON.parse(modal.getAttribute("data-initial-location") || "null")).toEqual(mockUserLocation);
    });

    it("passes initialHidden correctly when location is hidden", () => {
      renderMapPage({ userLocationHidden: true });

      const modal = screen.getByTestId("set-location-modal");
      expect(modal.getAttribute("data-initial-hidden")).toBe("true");
    });

    it("passes initialHidden correctly when location is visible", () => {
      renderMapPage();

      const modal = screen.getByTestId("set-location-modal");
      expect(modal.getAttribute("data-initial-hidden")).toBe("false");
    });
  });

  describe("Edge cases", () => {
    it("renders with null userLocation", () => {
      renderMapPage({ userLocation: null });

      const mapView = screen.getByTestId("map-view");
      expect(JSON.parse(mapView.getAttribute("data-user-location") || "null")).toBeNull();
    });

    it("renders with an empty events array", () => {
      renderMapPage({ events: [] });

      const mapView = screen.getByTestId("map-view");
      expect(JSON.parse(mapView.getAttribute("data-events") || "[]")).toEqual([]);
    });

    it("renders with both null userLocation and hidden true", () => {
      renderMapPage({
        events: [],
        userLocation: null,
        userLocationHidden: true,
      });

      expect(screen.getByText("Location hidden from friends")).toBeInTheDocument();

      const mapView = screen.getByTestId("map-view");
      expect(JSON.parse(mapView.getAttribute("data-user-location") || "null")).toBeNull();
    });
  });
});