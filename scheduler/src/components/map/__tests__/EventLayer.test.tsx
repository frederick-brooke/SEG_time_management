import React from "react";
import { Button } from "@/components/ui/Button";
import { render } from "@testing-library/react";

// Mocks

jest.mock("leaflet", () => ({
  marker: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  })),
  polyline: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
  })),
  divIcon: jest.fn(() => ({})),
}));

const mockUseMap = jest.fn();
jest.mock("react-leaflet", () => ({
  useMap: () => mockUseMap(),
}));

jest.mock("@/lib/map", () => ({
  CATEGORY_COLORS: { Work: "#3b82f6", Sport: "#10b981" },
  TRANSPORT_ICONS: { DRIVE: "🚗", WALK: "🚶" },
  formatDate: jest.fn((d: string) => `formatted:${d}`),
  createPinSvg: jest.fn(() => "<svg>pin</svg>"),
}));

import { EventLayer } from "../EventLayer";
import type { MapEvent } from "@/lib/map";

// Fixtures 

const mockRemoveLayer = jest.fn();
const mockFitBounds = jest.fn();
const mockGetZoom = jest.fn().mockReturnValue(12);

const makeMap = () => ({
  removeLayer: mockRemoveLayer,
  fitBounds: mockFitBounds,
  getZoom: mockGetZoom,
});

const makeEvent = (id: string, opts: Record<string, unknown> = {}) =>
  ({
    id,
    title: `Event ${id}`,
    category: "Work",
    start: "2025-01-01T10:00:00Z",
    end: "2025-01-01T11:00:00Z",
    transportMode: "DRIVE",
    travelDuration: 30,
    startLocationName: "Home",
    destLocationName: "Office",
    startCoords: { lat: 51.5, lng: -0.1 },
    destinationCoords: { lat: 51.6, lng: -0.2 },
    ...opts,
  } as MapEvent);

// Tests

describe("EventLayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMap.mockReturnValue(makeMap());
  });

  it("renders null (no DOM output)", () => {
    const { container } = render(<EventLayer events={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("does not throw when events array is empty", () => {
    expect(() => render(<EventLayer events={[]} />)).not.toThrow();
  });

  it("returns null regardless of events length", () => {
    const { container } = render(<EventLayer events={[makeEvent("a")]} />);
    expect(container.firstChild).toBeNull();
  });

  it("does not throw when an event has no startCoords", () => {
    const event = makeEvent("a", { startCoords: undefined });
    expect(() => render(<EventLayer events={[event]} />)).not.toThrow();
  });

  it("does not throw when an event has no destinationCoords", () => {
    const event = makeEvent("a", { destinationCoords: undefined });
    expect(() => render(<EventLayer events={[event]} />)).not.toThrow();
  });

  it("does not throw when an event has neither startCoords nor destinationCoords", () => {
    const event = makeEvent("a", {
      startCoords: undefined,
      destinationCoords: undefined,
    });
    expect(() => render(<EventLayer events={[event]} />)).not.toThrow();
  });

  it("does not throw when transportMode is undefined (uses fallback icon)", () => {
    const event = makeEvent("a", { transportMode: undefined });
    expect(() => render(<EventLayer events={[event]} />)).not.toThrow();
  });

  it("does not throw when travelDuration is undefined", () => {
    const event = makeEvent("a", { travelDuration: undefined });
    expect(() => render(<EventLayer events={[event]} />)).not.toThrow();
  });

  it("does not throw for unknown category (uses fallback color #6b7280)", () => {
    const event = makeEvent("a", { category: "Unknown" });
    expect(() => render(<EventLayer events={[event]} />)).not.toThrow();
  });

  it("does not throw with multiple events", () => {
    const events = [makeEvent("a"), makeEvent("b"), makeEvent("c")];
    expect(() => render(<EventLayer events={events} />)).not.toThrow();
  });

  it("re-renders without throwing when events change", () => {
    const { rerender } = render(<EventLayer events={[makeEvent("a")]} />);
    expect(() =>
      rerender(<EventLayer events={[makeEvent("b")]} />)
    ).not.toThrow();
  });

  it("cleans up on unmount without throwing", () => {
    const { unmount } = render(<EventLayer events={[makeEvent("a")]} />);
    expect(() => unmount()).not.toThrow();
  });
});
