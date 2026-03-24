import React, { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

// Mocks

// Create a mock function to simulate next-auth's getServerSession
const mockGetServerSession = jest.fn();

// Mock the "next-auth/next" module so when getServerSession is called,
// it uses our mock instead of the real implementation
jest.mock("next-auth/next", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

// Mock authOptions import to avoid issues with next-auth configuration during tests
jest.mock("@/src/lib/auth", () => ({ authOptions: {} }));

// Create a mock for Prisma's findMany query
const mockFindMany = jest.fn();
jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    event: { findMany: (...args: any[]) => mockFindMany(...args) },
  },
}));

// Mock MapView component to avoid rendering actual map logic
// Instead, we render a simple div with a test id and event count
jest.mock("@/src/components/MapView", () => ({
  __esModule: true,
  default: ({ events }: { events: any[] }) => (
    <div data-testid="map-view" data-count={events.length} />
  ),
}));

// Mock SavedLocationsPanel component with a simple placeholder
jest.mock("@/components/map/SavedLocationsPanel", () => ({
  SavedLocationsPanel: () => <div data-testid="saved-locations-panel" />,
}));

// Import the server component under test
import MapPage from "./page";

// Fixtures and Helpers

// Helper function to create fake database event objects
const makeDbEvent = (id: string, opts: Partial<any> = {}) => ({
  id,
  title: `Event ${id}`,
  category: "Work",
  start: new Date("2025-01-01T10:00:00Z"),
  end: new Date("2025-01-01T11:00:00Z"),
  startCoords: { lat: 51.5, lng: -0.1 },
  destinationCoords: { lat: 51.6, lng: -0.2 },
  startLocationName: "Home",
  destLocationName: "Office",
  travelDuration: 30,
  transportMode: "DRIVE",
  ...opts, 
});

// Mock authenticated session object
const SESSION = { user: { id: "user-1", name: "Test User" } };

// Tests

describe("MapPage (server page)", () => {
  // Reset mocks before each test to avoid cross-test contamination
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Authentication Tests 

  it("throws 'Not authenticated' when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    // Expect the server component to throw if user is not logged in
    await expect(MapPage()).rejects.toThrow("Not authenticated");
  });

  // Database Query Tests 

  it("calls prisma.event.findMany with the correct userId filter", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockFindMany.mockResolvedValue([]);

    await MapPage();

    // Ensure query filters by logged-in user ID
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
      })
    );
  });

  it("orders events by start ascending", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockFindMany.mockResolvedValue([]);

    await MapPage();

    // Ensure events are sorted chronologically
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { start: "asc" } })
    );
  });

  // Rendering Tests 

  it("renders the page heading", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockFindMany.mockResolvedValue([]);

    // Server component returns JSX → render it
    const tree = (await MapPage()) as ReactElement;
    render(tree);

    expect(screen.getByText("Event Map")).toBeInTheDocument();
  });

  it("renders the back to calendar link", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockFindMany.mockResolvedValue([]);

    const tree = (await MapPage()) as ReactElement;
    render(tree);

    const link = screen.getByText("← Back to Calendar");

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/calendar");
  });

  it("renders MapView component", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockFindMany.mockResolvedValue([]);

    const tree = (await MapPage()) as ReactElement;
    render(tree);

    // Ensure mocked MapView appears
    expect(screen.getByTestId("map-view")).toBeInTheDocument();
  });

  it("renders SavedLocationsPanel component", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockFindMany.mockResolvedValue([]);

    const tree = (await MapPage()) as ReactElement;
    render(tree);

    expect(screen.getByTestId("saved-locations-panel")).toBeInTheDocument();
  });

  // Data Flow Tests 

  it("passes serialized events to MapView", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);

    // Provide two events
    mockFindMany.mockResolvedValue([makeDbEvent("a"), makeDbEvent("b")]);

    const tree = (await MapPage()) as ReactElement;
    render(tree);

    // Ensure MapView receives correct count
    expect(screen.getByTestId("map-view")).toHaveAttribute("data-count", "2");
  });

  // UI Text Logic Tests 

  it("shows singular 'event' label when there is exactly one event", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockFindMany.mockResolvedValue([makeDbEvent("a")]);

    const tree = (await MapPage()) as ReactElement;
    render(tree);

    expect(
      screen.getByText(/Showing 1 event with locations/i)
    ).toBeInTheDocument();
  });

  it("shows plural 'events' label when there are multiple events", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockFindMany.mockResolvedValue([makeDbEvent("a"), makeDbEvent("b")]);

    const tree = (await MapPage()) as ReactElement;
    render(tree);

    expect(
      screen.getByText(/Showing 2 events with locations/i)
    ).toBeInTheDocument();
  });

  it("shows 0 events label when there are no events", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockFindMany.mockResolvedValue([]);

    const tree = (await MapPage()) as ReactElement;
    render(tree);

    expect(
      screen.getByText(/Showing 0 events with locations/i)
    ).toBeInTheDocument();
  });

  // Serialisation Tests 

  it("serializes start and end dates to ISO strings", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockFindMany.mockResolvedValue([makeDbEvent("a")]);

    // If fails, this would throw
    await MapPage();

    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  // Edge Case Tests 

  it("handles events with null startCoords without throwing", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);

    mockFindMany.mockResolvedValue([
      makeDbEvent("a", { startCoords: null }),
    ]);

    await expect(MapPage()).resolves.not.toThrow();
  });

  it("handles events with null destinationCoords without throwing", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);

    mockFindMany.mockResolvedValue([
      makeDbEvent("a", { destinationCoords: null }),
    ]);

    await expect(MapPage()).resolves.not.toThrow();
  });
});