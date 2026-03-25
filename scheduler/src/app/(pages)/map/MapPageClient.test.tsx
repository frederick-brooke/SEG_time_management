import React, { ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MapPageClient from "./MapPageClient";

// Mocks

jest.mock("@/components/MapView", () => ({
  __esModule: true,
  default: ({
    events,
    userLocation,
  }: {
    events: any[];
    userLocation: { lat: number; lng: number } | null;
  }) => (
    <div
      data-testid="map-view"
      data-count={events.length}
      data-has-location={userLocation !== null ? "true" : "false"}
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
    initialLocation: { lat: number; lng: number } | null;
    initialHidden: boolean;
  }) => (
    <div
      data-testid="set-location-modal"
      data-open={isOpen ? "true" : "false"}
      data-hidden={initialHidden ? "true" : "false"}
      data-has-location={initialLocation !== null ? "true" : "false"}
    >
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}));

// Fixtures

const USER_LOCATION = { lat: 51.5074, lng: -0.1278 };

function makeEvent(id: string, overrides: Partial<any> = {}) {
  return {
    id,
    title: `Event ${id}`,
    category: "Work",
    start: "2025-01-01T10:00:00Z",
    end: "2025-01-01T11:00:00Z",
    startCoords: { lat: 51.5, lng: -0.1 },
    destinationCoords: { lat: 51.6, lng: -0.2 },
    startLocationName: "Home",
    destLocationName: "Office",
    travelDuration: 30,
    transportMode: "DRIVE",
    ...overrides,
  };
}

const DEFAULT_PROPS = {
  events: [],
  userLocation: USER_LOCATION,
  userLocationHidden: false,
};

function renderClient(props: Partial<typeof DEFAULT_PROPS> = {}) {
  return render(<MapPageClient {...DEFAULT_PROPS} {...props} />);
}

// Tests

describe("MapPageClient (client component)", () => {
  beforeEach(() => jest.clearAllMocks());

  // Core rendering

  it("renders without crashing", () => {
    renderClient();
  });

  it("renders the MapView component", () => {
    renderClient();
    expect(screen.getByTestId("map-view")).toBeInTheDocument();
  });

  it("renders the SavedLocationsPanel component", () => {
    renderClient();
    expect(screen.getByTestId("saved-locations-panel")).toBeInTheDocument();
  });

  it("renders the Set Your Location button", () => {
    renderClient();
    expect(
      screen.getByRole("button", { name: /set your location/i })
    ).toBeInTheDocument();
  });

  it("renders the SetLocationModal component", () => {
    renderClient();
    expect(screen.getByTestId("set-location-modal")).toBeInTheDocument();
  });

  // Data flow — events

  it("passes the correct event count to MapView", () => {
    renderClient({ events: [makeEvent("a"), makeEvent("b")] });
    expect(screen.getByTestId("map-view")).toHaveAttribute("data-count", "2");
  });

  it("passes zero events to MapView when events array is empty", () => {
    renderClient({ events: [] });
    expect(screen.getByTestId("map-view")).toHaveAttribute("data-count", "0");
  });

  // Data flow — userLocation

  it("passes userLocation to MapView when provided", () => {
    renderClient({ userLocation: USER_LOCATION });
    expect(screen.getByTestId("map-view")).toHaveAttribute(
      "data-has-location",
      "true"
    );
  });

  it("passes null userLocation to MapView when not provided", () => {
    renderClient({ userLocation: null });
    expect(screen.getByTestId("map-view")).toHaveAttribute(
      "data-has-location",
      "false"
    );
  });

  it("passes userLocation to SetLocationModal", () => {
    renderClient({ userLocation: USER_LOCATION });
    expect(screen.getByTestId("set-location-modal")).toHaveAttribute(
      "data-has-location",
      "true"
    );
  });

  it("passes null userLocation to SetLocationModal when not provided", () => {
    renderClient({ userLocation: null });
    expect(screen.getByTestId("set-location-modal")).toHaveAttribute(
      "data-has-location",
      "false"
    );
  });

  // Location modal — open/close state

  it("renders the modal closed by default", () => {
    renderClient();
    expect(screen.getByTestId("set-location-modal")).toHaveAttribute(
      "data-open",
      "false"
    );
  });

  it("opens the modal when the Set Your Location button is clicked", () => {
    renderClient();
    fireEvent.click(screen.getByRole("button", { name: /set your location/i }));
    expect(screen.getByTestId("set-location-modal")).toHaveAttribute(
      "data-open",
      "true"
    );
  });

  it("closes the modal when onClose is called", () => {
    renderClient();
    fireEvent.click(screen.getByRole("button", { name: /set your location/i }));
    expect(screen.getByTestId("set-location-modal")).toHaveAttribute(
      "data-open",
      "true"
    );
    fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
    expect(screen.getByTestId("set-location-modal")).toHaveAttribute(
      "data-open",
      "false"
    );
  });

  // Location visibility — userLocationHidden prop

  it("passes initialHidden=false to modal when userLocationHidden is false", () => {
    renderClient({ userLocationHidden: false });
    expect(screen.getByTestId("set-location-modal")).toHaveAttribute(
      "data-hidden",
      "false"
    );
  });

  it("passes initialHidden=true to modal when userLocationHidden is true", () => {
    renderClient({ userLocationHidden: true });
    expect(screen.getByTestId("set-location-modal")).toHaveAttribute(
      "data-hidden",
      "true"
    );
  });

  it("shows 'Location visible to friends' when userLocationHidden is false", () => {
    renderClient({ userLocationHidden: false });
    expect(
      screen.getByText(/location visible to friends/i)
    ).toBeInTheDocument();
  });

  it("shows 'Location hidden from friends' when userLocationHidden is true", () => {
    renderClient({ userLocationHidden: true });
    expect(
      screen.getByText(/location hidden from friends/i)
    ).toBeInTheDocument();
  });

  it("shows 'Friends can see your location' sub-text when visible", () => {
    renderClient({ userLocationHidden: false });
    expect(
      screen.getByText(/friends can see your location/i)
    ).toBeInTheDocument();
  });

  it("shows 'Friends cannot see your location' sub-text when hidden", () => {
    renderClient({ userLocationHidden: true });
    expect(
      screen.getByText(/friends cannot see your location/i)
    ).toBeInTheDocument();
  });

  // Edge cases — null coordinates on events

  it("handles events with null startCoords without throwing", () => {
    expect(() =>
      renderClient({ events: [makeEvent("a", { startCoords: null })] })
    ).not.toThrow();
  });

  it("handles events with null destinationCoords without throwing", () => {
    expect(() =>
      renderClient({ events: [makeEvent("a", { destinationCoords: null })] })
    ).not.toThrow();
  });

  it("handles events with null travelDuration without throwing", () => {
    expect(() =>
      renderClient({ events: [makeEvent("a", { travelDuration: null })] })
    ).not.toThrow();
  });

  it("handles events with null startLocationName without throwing", () => {
    expect(() =>
      renderClient({ events: [makeEvent("a", { startLocationName: null })] })
    ).not.toThrow();
  });
});
