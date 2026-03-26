import React, { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import MapPage from "./page";

// Mocks 

const mockGetServerSession = jest.fn();
const mockFindMany = jest.fn();

jest.mock("next-auth/next", () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));

jest.mock("@/lib/auth", () => ({ authOptions: {} }));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    event: { findMany: (...args: any[]) => mockFindMany(...args) },
  },
}));

// Renders a minimal stand-in so tests aren't coupled to map implementation details
jest.mock("@/components/map/MapView", () => ({
  __esModule: true,
  default: ({ events }: { events: any[] }) => (
    <div data-testid="map-view" data-count={events.length} />
  ),
}));

jest.mock("@/components/map/SavedLocationsPanel", () => ({
  SavedLocationsPanel: () => <div data-testid="saved-locations-panel" />,
}));

// Fixtures

const SESSION = { user: { id: "user-1", name: "Test User" } };

function makeDbEvent(id: string, overrides: Partial<any> = {}) {
  return {
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
    ...overrides,
  };
}

// Helpers 

function setupSession(events: any[] = []) {
  mockGetServerSession.mockResolvedValue(SESSION);
  mockFindMany.mockResolvedValue(events);
}

async function renderMapPage(events: any[] = []) {
  setupSession(events);
  const tree = (await MapPage()) as ReactElement;
  render(tree);
}

//  Tests 

describe("MapPage (server page)", () => {
  beforeEach(() => jest.clearAllMocks());

  // Authentication

  it("throws 'Not authenticated' when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    await expect(MapPage()).rejects.toThrow("Not authenticated");
  });

  // Database queries

  it("queries events filtered by the logged-in user's id", async () => {
    await renderMapPage();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
      })
    );
  });

  it("orders events by start time ascending", async () => {
    await renderMapPage();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { start: "asc" } })
    );
  });

  // Rendering

  it("renders the page heading", async () => {
    await renderMapPage();
    expect(screen.getByText("Event Map")).toBeInTheDocument();
  });

  it("renders a back-to-calendar link pointing to /calendar", async () => {
    await renderMapPage();
    const link = screen.getByText("← Back to Calendar");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/calendar");
  });

  it("renders the MapView component", async () => {
    await renderMapPage();
    expect(screen.getByTestId("map-view")).toBeInTheDocument();
  });

  it("renders the SavedLocationsPanel component", async () => {
    await renderMapPage();
    expect(screen.getByTestId("saved-locations-panel")).toBeInTheDocument();
  });

  // Data flow

  it("passes the correct event count to MapView", async () => {
    await renderMapPage([makeDbEvent("a"), makeDbEvent("b")]);
    expect(screen.getByTestId("map-view")).toHaveAttribute("data-count", "2");
  });

  // Event count label — singular / plural / zero

  it("shows singular label for exactly one event", async () => {
    await renderMapPage([makeDbEvent("a")]);
    expect(screen.getByText(/Showing 1 event with locations/i)).toBeInTheDocument();
  });

  it("shows plural label for multiple events", async () => {
    await renderMapPage([makeDbEvent("a"), makeDbEvent("b")]);
    expect(screen.getByText(/Showing 2 events with locations/i)).toBeInTheDocument();
  });

  it("shows zero label when there are no events", async () => {
    await renderMapPage();
    expect(screen.getByText(/Showing 0 events with locations/i)).toBeInTheDocument();
  });

  // Serialisation

  it("serialises event dates to ISO strings without throwing", async () => {
    await renderMapPage([makeDbEvent("a")]);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  // Edge cases — null coordinates

  it("handles an event with null startCoords without throwing", async () => {
    setupSession([makeDbEvent("a", { startCoords: null })]);
    await expect(MapPage()).resolves.not.toThrow();
  });

  it("handles an event with null destinationCoords without throwing", async () => {
    setupSession([makeDbEvent("a", { destinationCoords: null })]);
    await expect(MapPage()).resolves.not.toThrow();
  });
});
