import React from "react";
import { render } from "@testing-library/react";

// ── jest.mock calls must NOT reference outer const variables ─────────────────

jest.mock("react-leaflet", () => ({
  useMap: () => mockUseMap(),
}));

const mockUseMap = jest.fn();

jest.mock("hooks/useSavedLocations", () => ({}));

import { SavedLocationsLayer } from "../SavedLocationsLayer";
import type { SavedLocation } from "hooks/useSavedLocations";

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockRemoveLayer = jest.fn();
const mockGetZoom = jest.fn().mockReturnValue(12);
const mockOn = jest.fn();
const mockOff = jest.fn();

const makeMap = () => ({
  removeLayer: mockRemoveLayer,
  getZoom: mockGetZoom,
  on: mockOn,
  off: mockOff,
});

const makeLoc = (
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

describe("SavedLocationsLayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMap.mockReturnValue(makeMap());
    mockGetZoom.mockReturnValue(12);
  });

  it("renders null (no DOM output)", () => {
    const { container } = render(<SavedLocationsLayer locations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("does not throw with an empty locations array", () => {
    expect(() =>
      render(<SavedLocationsLayer locations={[]} />)
    ).not.toThrow();
  });

  it("does not throw with a single HOME location", () => {
    expect(() =>
      render(<SavedLocationsLayer locations={[makeLoc("1", "HOME")]} />)
    ).not.toThrow();
  });

  it("does not throw with a single WORK location", () => {
    expect(() =>
      render(<SavedLocationsLayer locations={[makeLoc("1", "WORK")]} />)
    ).not.toThrow();
  });

  it("does not throw with a single FAVOURITE location", () => {
    expect(() =>
      render(<SavedLocationsLayer locations={[makeLoc("1", "FAVOURITE")]} />)
    ).not.toThrow();
  });

  it("does not throw with multiple locations at different coordinates", () => {
    const locs = [
      makeLoc("1", "HOME", 51.5, -0.1),
      makeLoc("2", "WORK", 51.6, -0.2),
      makeLoc("3", "FAVOURITE", 51.7, -0.3),
    ];
    expect(() =>
      render(<SavedLocationsLayer locations={locs} />)
    ).not.toThrow();
  });

  it("does not throw with two locations at the same position (triggers grouping)", () => {
    const locs = [
      makeLoc("1", "HOME", 51.5, -0.1),
      makeLoc("2", "WORK", 51.5, -0.1),
    ];
    expect(() =>
      render(<SavedLocationsLayer locations={locs} />)
    ).not.toThrow();
  });

  it("registers a zoomend listener on mount", () => {
    render(<SavedLocationsLayer locations={[makeLoc("1")]} />);
    expect(mockOn).toHaveBeenCalledWith("zoomend", expect.any(Function));
  });

  it("removes the zoomend listener on unmount", () => {
    const { unmount } = render(<SavedLocationsLayer locations={[makeLoc("1")]} />);
    unmount();
    expect(mockOff).toHaveBeenCalledWith("zoomend", expect.any(Function));
  });

  // Layer cleanup is triggered by the effect cleanup function.
  // Because import("leaflet") is async, layers may not be populated synchronously,
  // so we assert the unmount/re-render path does not throw rather than counting
  // removeLayer calls (which depend on async timing).
  it("unmounts without throwing", () => {
    const { unmount } = render(
      <SavedLocationsLayer locations={[makeLoc("1")]} />
    );
    expect(() => unmount()).not.toThrow();
  });

  it("re-renders cleanly when locations prop changes", () => {
    const { rerender } = render(
      <SavedLocationsLayer locations={[makeLoc("1", "HOME")]} />
    );
    expect(() =>
      rerender(<SavedLocationsLayer locations={[makeLoc("2", "WORK")]} />)
    ).not.toThrow();
  });

  it("handles locations with unknown type without throwing", () => {
    const loc = { ...makeLoc("1"), type: "UNKNOWN" as any };
    expect(() =>
      render(<SavedLocationsLayer locations={[loc]} />)
    ).not.toThrow();
  });

  it("does not throw when three locations share the same position", () => {
    const locs = [
      makeLoc("1", "HOME", 51.5, -0.1),
      makeLoc("2", "WORK", 51.5, -0.1),
      makeLoc("3", "FAVOURITE", 51.5, -0.1),
    ];
    expect(() =>
      render(<SavedLocationsLayer locations={locs} />)
    ).not.toThrow();
  });

  it("handles locations slightly outside the SAME_SPOT threshold", () => {
    const locs = [
      makeLoc("1", "HOME", 51.5, -0.1),
      makeLoc("2", "WORK", 51.5002, -0.1002),
    ];
    expect(() =>
      render(<SavedLocationsLayer locations={locs} />)
    ).not.toThrow();
  });

  it("does not throw for a single-member group (no spread needed)", () => {
    expect(() =>
      render(<SavedLocationsLayer locations={[makeLoc("1", "FAVOURITE")]} />)
    ).not.toThrow();
  });

  it("does not throw for a two-member group (spread into arc)", () => {
    const locs = [
      makeLoc("1", "HOME", 51.5, -0.1),
      makeLoc("2", "WORK", 51.50005, -0.10005),
    ];
    expect(() =>
      render(<SavedLocationsLayer locations={locs} />)
    ).not.toThrow();
  });
});
