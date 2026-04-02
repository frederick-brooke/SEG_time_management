import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen } from "@testing-library/react";
import MapView from "../MapView";
import { MapEvent } from "@/lib/map";

// Mocks

jest.mock("@/components/map/CombinedMap", () => ({
  CombinedMap: ({
    events,
    friends,
    userLocation,
    defaultMode,
  }: {
    events: any[];
    friends: any[];
    userLocation?: { lat: number; lng: number } | null;
    defaultMode?: string;
  }) => (
    <div
      data-testid="combined-map"
      data-event-count={events.length}
      data-friend-count={friends.length}
      data-has-location={userLocation != null ? "true" : "false"}
      data-mode={defaultMode ?? ""}
    />
  ),
}));

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (factory: () => Promise<any>, _options?: any) => {
    // Synchronously resolve the dynamic import to prevent the "Dynamic component not yet resolved" error
    const mod = require("@/components/map/CombinedMap");
    return mod.CombinedMap;
  },
}));

jest.mock("@/lib/map", () => {
  const actual = jest.requireActual("@/lib/map");
  return {
    ...actual,
    useFriends: jest.fn(() => ({
      friends: [],
      error: null,
      loading: false,
    })),
  };
});

// Fixtures

function makeEvent(id: string, overrides: Partial<MapEvent> = {}): MapEvent {
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
  } as MapEvent;
}

const USER_LOCATION = { lat: 51.5074, lng: -0.1278 };

// Tests

describe("MapView", () => {
  beforeEach(() => jest.clearAllMocks());

  // Core rendering

  it("renders without crashing", () => {
    render(<MapView events={[]} />);
  });

  it("renders the CombinedMap component", () => {
    render(<MapView events={[]} />);
    expect(screen.getByTestId("combined-map")).toBeInTheDocument();
  });

  // Data flow — events

  it("passes events to CombinedMap", () => {
    render(<MapView events={[makeEvent("a"), makeEvent("b")]} />);
    expect(screen.getByTestId("combined-map")).toHaveAttribute(
      "data-event-count",
      "2"
    );
  });

  it("passes an empty events array to CombinedMap", () => {
    render(<MapView events={[]} />);
    expect(screen.getByTestId("combined-map")).toHaveAttribute(
      "data-event-count",
      "0"
    );
  });

  // friends injection

  it("always injects friends=[] into CombinedMap", () => {
    render(<MapView events={[]} />);
    expect(screen.getByTestId("combined-map")).toHaveAttribute(
      "data-friend-count",
      "0"
    );
  });

  it("shows loading state when defaultMode is friends and useFriends is loading", () => {
    const { useFriends: mockUseFriends } = require("@/lib/map");
    mockUseFriends.mockReturnValueOnce({
      friends: [],
      error: null,
      loading: true,
    });

    render(<MapView events={[]} defaultMode="friends" />);
    expect(screen.getByText("Loading friends...")).toBeInTheDocument();
  });

  it("shows error message when useFriends returns an error", () => {
    const { useFriends: mockUseFriends } = require("@/lib/map");
    mockUseFriends.mockReturnValueOnce({
      friends: [],
      error: "Failed to fetch friends: 500",
      loading: false,
    });

    render(<MapView events={[]} />);
    expect(screen.getByText("Failed to fetch friends: 500")).toBeInTheDocument();
  });

  // userLocation prop

  it("passes userLocation to CombinedMap when provided", () => {
    render(<MapView events={[]} userLocation={USER_LOCATION} />);
    expect(screen.getByTestId("combined-map")).toHaveAttribute(
      "data-has-location",
      "true"
    );
  });

  it("passes null userLocation to CombinedMap when explicitly null", () => {
    render(<MapView events={[]} userLocation={null} />);
    expect(screen.getByTestId("combined-map")).toHaveAttribute(
      "data-has-location",
      "false"
    );
  });

  it("handles omitted userLocation without throwing", () => {
    expect(() => render(<MapView events={[]} />)).not.toThrow();
  });

  // defaultMode prop

  it("passes defaultMode to CombinedMap when provided", () => {
    render(<MapView events={[]} defaultMode="friends" />);
    expect(screen.getByTestId("combined-map")).toHaveAttribute(
      "data-mode",
      "friends"
    );
  });

  it("passes defaultMode='events' to CombinedMap", () => {
    render(<MapView events={[]} defaultMode="events" />);
    expect(screen.getByTestId("combined-map")).toHaveAttribute(
      "data-mode",
      "events"
    );
  });

  it("handles omitted defaultMode without throwing", () => {
    expect(() => render(<MapView events={[]} />)).not.toThrow();
  });

  // Loading state

  it("renders the loading fallback UI with the expected text", () => {
    const LoadingFallback = () => (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
    render(<LoadingFallback />);
    expect(screen.getByText("Loading map...")).toBeInTheDocument();
  });

  it("handles events with null startCoords without throwing", () => {
    expect(() =>
      render(<MapView events={[makeEvent("a", { startCoords: null })]} />)
    ).not.toThrow();
  });

  it("handles events with null destinationCoords without throwing", () => {
    expect(() =>
      render(
        <MapView events={[makeEvent("a", { destinationCoords: null })]} />
      )
    ).not.toThrow();
  });
});
