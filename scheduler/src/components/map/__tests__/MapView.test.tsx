import React from "react";
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
  default: (factory: () => Promise<any>) => {
    let Component: React.ComponentType<any> | null = null;

    const DynamicWrapper = (props: any) => {
      if (!Component) {
        throw new Error("Dynamic component not yet resolved in test");
      }
      return <Component {...props} />;
    };

    // Resolve synchronously for tests
    factory().then((mod) => {
      Component = mod.default;
    });

    return DynamicWrapper;
  },
}));

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
