import React from "react";
import { render } from "@testing-library/react";

// ── jest.mock calls must NOT reference outer const variables ─────────────────
// jest.mock is hoisted above const declarations — all fns inlined in factories.

jest.mock("react-leaflet", () => ({
  useMap: () => mockUseMap(),
}));

const mockUseMap = jest.fn();

jest.mock("@/lib/map", () => ({
  CATEGORY_COLORS: { Work: "#3b82f6", Sport: "#10b981" },
  TRANSPORT_ICONS: { DRIVE: "🚗", WALK: "🚶" },
  formatDate: jest.fn((d: string) => `formatted:${d}`),
  createPinSvg: jest.fn(() => "<svg>pin</svg>"),
}));

jest.mock("hooks/useSavedLocations", () => ({}));

import { UnifiedMapLayer } from "../UnifiedMapLayer";
import type { MapEvent } from "@/lib/map";
import type { SavedLocation } from "hooks/useSavedLocations";

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockRemoveLayer = jest.fn();
const mockGetZoom = jest.fn().mockReturnValue(12);
const mockFitBounds = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();

const makeMap = () => ({
  removeLayer: mockRemoveLayer,
  getZoom: mockGetZoom,
  fitBounds: mockFitBounds,
  on: mockOn,
  off: mockOff,
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

const makeSaved = (
  id: string,
  type: "HOME" | "WORK" | "FAVOURITE" = "HOME",
  lat = 51.5,
  lng = -0.1
): SavedLocation => ({
  id,
  type,
  label: `Label ${id}`,
  address: `Address ${id}`,
  lat,
  lng,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("UnifiedMapLayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMap.mockReturnValue(makeMap());
    mockGetZoom.mockReturnValue(12);
  });

  it("renders null (no DOM output)", () => {
    const { container } = render(
      <UnifiedMapLayer events={[]} savedLocations={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not throw with empty events and savedLocations", () => {
    expect(() =>
      render(<UnifiedMapLayer events={[]} savedLocations={[]} />)
    ).not.toThrow();
  });

  it("does not throw with a single event that has both start and destination", () => {
    expect(() =>
      render(<UnifiedMapLayer events={[makeEvent("a")]} savedLocations={[]} />)
    ).not.toThrow();
  });

  it("does not throw with an event missing startCoords", () => {
    const event = makeEvent("a", { startCoords: undefined });
    expect(() =>
      render(<UnifiedMapLayer events={[event]} savedLocations={[]} />)
    ).not.toThrow();
  });

  it("does not throw with an event missing destinationCoords", () => {
    const event = makeEvent("a", { destinationCoords: undefined });
    expect(() =>
      render(<UnifiedMapLayer events={[event]} savedLocations={[]} />)
    ).not.toThrow();
  });

  it("does not throw with an event missing both coords", () => {
    const event = makeEvent("a", {
      startCoords: undefined,
      destinationCoords: undefined,
    });
    expect(() =>
      render(<UnifiedMapLayer events={[event]} savedLocations={[]} />)
    ).not.toThrow();
  });

  it("does not throw with a HOME saved location", () => {
    expect(() =>
      render(
        <UnifiedMapLayer events={[]} savedLocations={[makeSaved("1", "HOME")]} />
      )
    ).not.toThrow();
  });

  it("does not throw with a WORK saved location", () => {
    expect(() =>
      render(
        <UnifiedMapLayer events={[]} savedLocations={[makeSaved("1", "WORK")]} />
      )
    ).not.toThrow();
  });

  it("does not throw with a FAVOURITE saved location", () => {
    expect(() =>
      render(
        <UnifiedMapLayer
          events={[]}
          savedLocations={[makeSaved("1", "FAVOURITE")]}
        />
      )
    ).not.toThrow();
  });

  it("does not throw with mixed events and saved locations", () => {
    const events = [makeEvent("a"), makeEvent("b")];
    const saved = [makeSaved("1", "HOME"), makeSaved("2", "WORK", 51.6, -0.2)];
    expect(() =>
      render(<UnifiedMapLayer events={events} savedLocations={saved} />)
    ).not.toThrow();
  });

  it("registers a zoomend listener on the map", () => {
    render(<UnifiedMapLayer events={[makeEvent("a")]} savedLocations={[]} />);
    expect(mockOn).toHaveBeenCalledWith("zoomend", expect.any(Function));
  });

  it("removes the zoomend listener on unmount", () => {
    const { unmount } = render(
      <UnifiedMapLayer events={[makeEvent("a")]} savedLocations={[]} />
    );
    unmount();
    expect(mockOff).toHaveBeenCalledWith("zoomend", expect.any(Function));
  });

  it("registers saved-locations-updated listener on mount", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    render(<UnifiedMapLayer events={[]} savedLocations={[]} />);
    expect(addSpy).toHaveBeenCalledWith(
      "saved-locations-updated",
      expect.any(Function)
    );
    addSpy.mockRestore();
  });

  it("removes saved-locations-updated listener on unmount", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = render(
      <UnifiedMapLayer events={[]} savedLocations={[]} />
    );
    unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      "saved-locations-updated",
      expect.any(Function)
    );
    removeSpy.mockRestore();
  });

  it("re-renders without throwing when events change", () => {
    const { rerender } = render(
      <UnifiedMapLayer events={[makeEvent("a")]} savedLocations={[]} />
    );
    expect(() =>
      rerender(<UnifiedMapLayer events={[makeEvent("b")]} savedLocations={[]} />)
    ).not.toThrow();
  });

  it("re-renders without throwing when savedLocations change", () => {
    const { rerender } = render(
      <UnifiedMapLayer events={[]} savedLocations={[makeSaved("1")]} />
    );
    expect(() =>
      rerender(
        <UnifiedMapLayer events={[]} savedLocations={[makeSaved("2", "WORK")]} />
      )
    ).not.toThrow();
  });

  it("does not throw when two pins are at the exact same coords (groups them)", () => {
    const events = [
      makeEvent("a", {
        startCoords: { lat: 51.5, lng: -0.1 },
        destinationCoords: undefined,
      }),
    ];
    const saved = [makeSaved("1", "HOME", 51.5, -0.1)];
    expect(() =>
      render(<UnifiedMapLayer events={events} savedLocations={saved} />)
    ).not.toThrow();
  });

  it("does not throw on second render (hasFitBounds guard)", () => {
    const events = [makeEvent("a")];
    const { rerender } = render(
      <UnifiedMapLayer events={events} savedLocations={[]} />
    );
    expect(() =>
      rerender(<UnifiedMapLayer events={events} savedLocations={[]} />)
    ).not.toThrow();
  });

  it("handles an unknown saved location type without throwing", () => {
    const loc = { ...makeSaved("1"), type: "CUSTOM" as any };
    expect(() =>
      render(<UnifiedMapLayer events={[]} savedLocations={[loc]} />)
    ).not.toThrow();
  });

  it("handles unknown event category without throwing (uses fallback color)", () => {
    const event = makeEvent("a", { category: "Unknown" });
    expect(() =>
      render(<UnifiedMapLayer events={[event]} savedLocations={[]} />)
    ).not.toThrow();
  });

  it("cleans up on unmount without throwing", () => {
    const { unmount } = render(
      <UnifiedMapLayer events={[makeEvent("a")]} savedLocations={[]} />
    );
    expect(() => unmount()).not.toThrow();
  });
});
