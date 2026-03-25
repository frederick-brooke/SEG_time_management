import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mocks

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (fn: () => Promise<{ [key: string]: React.ComponentType<any> }>, opts?: any) => {
    const Stub = (props: any) => {
      const name = opts?.loading ? "UnifiedMapLayer" : "DynamicComponent";
      return <div data-testid={`dynamic-${name}`} />;
    };
    return Stub;
  },
}));

jest.mock("../BaseMap", () => ({
  BaseMap: ({ children, center, zoom }: any) => (
    <div data-testid="base-map" data-center={JSON.stringify(center)} data-zoom={zoom}>
      {children}
    </div>
  ),
}));

jest.mock("../FriendLayer", () => ({
jest.mock("../FriendLayer", () => ({
  FriendLayer: ({ friends, userLocation }: any) => (
    <div
      data-testid="friend-layer"
      data-friends={JSON.stringify(friends)}
      data-user-location={JSON.stringify(userLocation)}
    />
  ),
}));

jest.mock("../UnifiedMapLayer", () => ({
jest.mock("../UnifiedMapLayer", () => ({
  UnifiedMapLayer: ({ events, savedLocations }: any) => (
    <div
      data-testid="unified-map-layer"
      data-events={JSON.stringify(events)}
      data-saved={JSON.stringify(savedLocations)}
    />
  ),
}));

jest.mock("../MapToggle", () => ({
jest.mock("../MapToggle", () => ({
  MapToggle: ({ mode, onChange, friendCount, eventCount }: any) => (
    <div data-testid="map-toggle">
      <button onClick={() => onChange("events")}>events-btn</button>
      <button onClick={() => onChange("friends")}>friends-btn</button>
      <span data-testid="toggle-mode">{mode}</span>
      <span data-testid="toggle-friend-count">{friendCount}</span>
      <span data-testid="toggle-event-count">{eventCount}</span>
    </div>
  ),
}));

const mockCalcCenter = jest.fn();
const mockFormatDate = jest.fn((d: string) => d);
const mockUseGeolocation = jest.fn();
const mockUseSavedLocations = jest.fn();

jest.mock("@/lib/map", () => ({
  calcCenter: (...args: any[]) => mockCalcCenter(...args),
  formatDate: (d: string) => mockFormatDate(d),
  useGeolocation: () => mockUseGeolocation(),
  CATEGORY_COLORS: { Work: "#3b82f6", Sport: "#10b981" },
  TRANSPORT_ICONS: { DRIVE: "🚗", WALK: "🚶" },
  MapMode: {},
}));

jest.mock("hooks/useSavedLocations", () => ({
  useSavedLocations: () => mockUseSavedLocations(),
}));

import { CombinedMap } from "../CombinedMap";
import type { MapEvent } from "@/lib/map";

// Fixtures

const DEFAULT_CENTER: [number, number] = [51.5, -0.1];

const makeFriend = (id: string, withLocation = true) => ({
  id,
  name: `Friend ${id}`,
  username: `friend_${id}`,
  pfp: null,
  city: "London",
  country: "UK",
  location: withLocation ? { lat: 51.5, lng: -0.1 } : null,
});

const makeEvent = (id: string, withCoords = true): MapEvent => ({
  id,
  title: `Event ${id}`,
  category: "Work",
  start: "2025-01-01T10:00:00Z",
  end: "2025-01-01T11:00:00Z",
  transportMode: "DRIVE",
  travelDuration: 30,
  startLocationName: "Home",
  destLocationName: "Office",
  startCoords: withCoords ? { lat: 51.5, lng: -0.1 } : undefined,
  destinationCoords: withCoords ? { lat: 51.6, lng: -0.2 } : undefined,
} as MapEvent);

function setupMocks({
  loading = false,
  userLocation = [51.5, -0.1] as [number, number] | null,
  locationError = null as string | null,
  savedLocations = [] as any[],
} = {}) {
  mockUseGeolocation.mockReturnValue({ userLocation, locationError, loading });
  mockUseSavedLocations.mockReturnValue({ locations: savedLocations });
  mockCalcCenter.mockReturnValue(DEFAULT_CENTER);
  mockFormatDate.mockImplementation((d) => d);
}

// Tests

describe("CombinedMap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Loading state
  it("renders loading spinner when geolocation is loading", () => {
    setupMocks({ loading: true });
    render(<CombinedMap friends={[]} events={[]} />);
    expect(screen.getByText(/Getting your location/i)).toBeInTheDocument();
  });

  it("does not render map content while loading", () => {
    setupMocks({ loading: true });
    render(<CombinedMap friends={[]} events={[]} />);
    expect(screen.queryByTestId("map-toggle")).not.toBeInTheDocument();
  });

  // Default mode
  it("defaults to events mode", () => {
    setupMocks();
    render(<CombinedMap friends={[]} events={[]} />);
    expect(screen.getByTestId("toggle-mode")).toHaveTextContent("events");
  });

  it("respects defaultMode prop", () => {
    setupMocks();
    render(<CombinedMap friends={[]} events={[]} defaultMode="friends" />);
    expect(screen.getByTestId("toggle-mode")).toHaveTextContent("friends");
  });

  // Toggle interaction
  it("switches to friends mode on toggle click", () => {
    setupMocks();
    render(<CombinedMap friends={[]} events={[]} />);
    fireEvent.click(screen.getByText("friends-btn"));
    expect(screen.getByTestId("toggle-mode")).toHaveTextContent("friends");
  });

  it("switches back to events mode from friends", () => {
    setupMocks();
    render(<CombinedMap friends={[]} events={[]} defaultMode="friends" />);
    fireEvent.click(screen.getByText("events-btn"));
    expect(screen.getByTestId("toggle-mode")).toHaveTextContent("events");
  });

  // Count props passed to MapToggle
  it("passes friend and event counts to MapToggle", () => {
    setupMocks();
    const friends = [makeFriend("1"), makeFriend("2")];
    const events = [makeEvent("a")];
    render(<CombinedMap friends={friends} events={events} />);
    expect(screen.getByTestId("toggle-friend-count")).toHaveTextContent("2");
    expect(screen.getByTestId("toggle-event-count")).toHaveTextContent("1");
  });

  // Location error banner
  it("shows location error message when present", () => {
    setupMocks({ locationError: "Location denied" });
    render(<CombinedMap friends={[]} events={[]} />);
    expect(screen.getByText(/Location denied/i)).toBeInTheDocument();
    expect(screen.getByText(/using default location/i)).toBeInTheDocument();
  });

  it("does not show error banner when no error", () => {
    setupMocks({ locationError: null });
    render(<CombinedMap friends={[]} events={[]} />);
    expect(screen.queryByText(/using default location/i)).not.toBeInTheDocument();
  });

  // Legend (events mode only)
  it("renders category legend in events mode", () => {
    setupMocks();
    render(<CombinedMap friends={[]} events={[]} />);
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Sport")).toBeInTheDocument();
  });

  it("does not render legend in friends mode", () => {
    setupMocks();
    render(<CombinedMap friends={[]} events={[]} defaultMode="friends" />);
    expect(screen.queryByText("Work")).not.toBeInTheDocument();
  });

  // Saved locations icons in legend
  it("shows Home icon in legend when HOME saved location exists", () => {
    setupMocks({ savedLocations: [{ type: "HOME", id: "1" }] });
    render(<CombinedMap friends={[]} events={[]} />);
    expect(screen.getByText("🏠")).toBeInTheDocument();
  });

  it("shows Work icon in legend when WORK saved location exists", () => {
    setupMocks({ savedLocations: [{ type: "WORK", id: "2" }] });
    render(<CombinedMap friends={[]} events={[]} />);
    expect(screen.getAllByText("Work").length).toBeGreaterThanOrEqual(2);
  });

  it("shows Saved icon in legend when FAVOURITE saved location exists", () => {
    setupMocks({ savedLocations: [{ type: "FAVOURITE", id: "3" }] });
    render(<CombinedMap friends={[]} events={[]} />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("does not show saved location badges when savedLocations is empty", () => {
    setupMocks({ savedLocations: [] });
    render(<CombinedMap friends={[]} events={[]} />);
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  // Event cards section
  it("renders event cards in events mode", () => {
    setupMocks();
    const events = [makeEvent("a"), makeEvent("b")];
    render(<CombinedMap friends={[]} events={events} />);
    expect(screen.getByText("Event a")).toBeInTheDocument();
    expect(screen.getByText("Event b")).toBeInTheDocument();
  });

  it("does not render event cards in friends mode", () => {
    setupMocks();
    const events = [makeEvent("a")];
    render(<CombinedMap friends={[]} events={events} defaultMode="friends" />);
    expect(screen.queryByText("Event a")).not.toBeInTheDocument();
  });

  it("renders travelDuration in event card when present", () => {
    setupMocks();
    render(<CombinedMap friends={[]} events={[makeEvent("a")]} />);
    expect(screen.getByText(/30 mins/i)).toBeInTheDocument();
  });

  it("renders startLocationName and destLocationName in event card", () => {
    setupMocks();
    render(<CombinedMap friends={[]} events={[makeEvent("a")]} />);
    expect(screen.getByText(/Home/)).toBeInTheDocument();
    expect(screen.getByText(/Office/)).toBeInTheDocument();
  });

  it("omits travelDuration row when not present on event", () => {
    setupMocks();
    const event = { ...makeEvent("a"), travelDuration: undefined };
    render(<CombinedMap friends={[]} events={[event]} />);
    expect(screen.queryByText(/mins/i)).not.toBeInTheDocument();
  });

  // calcCenter called correctly
  it("calls calcCenter with event coords in events mode", () => {
    setupMocks();
    const events = [makeEvent("a")];
    render(<CombinedMap friends={[]} events={events} />);
    expect(mockCalcCenter).toHaveBeenCalled();
    const arg = mockCalcCenter.mock.calls[0][0] as [number, number][];
    expect(arg).toContainEqual([51.5, -0.1]);
    expect(arg).toContainEqual([51.6, -0.2]);
  });

  it("calls calcCenter with friend coords and userLocation in friends mode", () => {
    setupMocks({ userLocation: [51.5, -0.1] });
    const friends = [makeFriend("1")];
    render(<CombinedMap friends={friends} events={[]} defaultMode="friends" />);
    expect(mockCalcCenter).toHaveBeenCalled();
    const arg = mockCalcCenter.mock.calls[0][0] as [number, number][];
    expect(arg).toContainEqual([51.5, -0.1]);
  });

  it("excludes friends without location from calcCenter args", () => {
    setupMocks({ userLocation: null });
    const friends = [makeFriend("1", false)];
    render(<CombinedMap friends={friends} events={[]} defaultMode="friends" />);
    const arg = mockCalcCenter.mock.calls[0][0] as [number, number][];
    expect(arg).toHaveLength(0);
  });

  // Zoom level
  it("passes zoom=2 to BaseMap in friends mode", () => {
    setupMocks();
    render(<CombinedMap friends={[]} events={[]} defaultMode="friends" />);
    expect(screen.getByTestId("toggle-mode")).toHaveTextContent("friends");
  });
});
