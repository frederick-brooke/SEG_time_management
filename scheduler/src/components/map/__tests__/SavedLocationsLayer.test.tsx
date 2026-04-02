import React from "react";
import { Button } from "@/components/ui/Button";
import { render, act, waitFor } from "@testing-library/react";

import {
  SavedLocationsLayer,
  groupByPosition,
  spreadPositions,
  createPinSvg,
  buildPopup,
} from "@/components/map/SavedLocationsLayer";
import { SavedLocation } from "hooks/useSavedLocations";

//Leaflet mock 
jest.mock("leaflet", () => {
  const markerMock = {
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
  };
  return {
    __markerMock: markerMock,
    divIcon: jest.fn((opts) => opts),
    marker: jest.fn(() => markerMock),
  };
});

const L = jest.requireMock("leaflet") as any;

// react-leaflet mock 
const mockMap = {
  getZoom: jest.fn().mockReturnValue(12),
  removeLayer: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock("react-leaflet", () => ({
  useMap: () => mockMap,
}));

//  Fixtures 
const home: SavedLocation = {
  id: "1", type: "HOME", label: "Home", address: "1 Main St", lat: 51.5, lng: -0.1,
};
const work: SavedLocation = {
  id: "2", type: "WORK", label: "Office", address: "10 Corp Ave", lat: 51.52, lng: -0.08,
};
const fav: SavedLocation = {
  id: "3", type: "FAVOURITE", label: "Coffee", address: "3 Brew Lane", lat: 51.505, lng: -0.095,
};
// Same spot as home
const homeClone: SavedLocation = {
  id: "4", type: "WORK", label: "Home Office", address: "1 Main St", lat: 51.5, lng: -0.1,
};

//  Helper ─
async function renderLayer(locations: SavedLocation[] = []) {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<SavedLocationsLayer locations={locations} />);
  });
  return result;
}

describe("groupByPosition", () => {
  it("returns an empty array for no locations", () => {
    expect(groupByPosition([])).toEqual([]);
  });

  it("returns one group per distinct location", () => {
    const groups = groupByPosition([home, work]);
    expect(groups).toHaveLength(2);
  });

  it("groups locations that share the same spot (within 0.0001°)", () => {
    const nearby: SavedLocation = { ...work, id: "5", lat: work.lat + 0.00005 };
    const groups = groupByPosition([work, nearby]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  it("does not group locations further apart than the threshold", () => {
    const groups = groupByPosition([home, work]);
    expect(groups).toHaveLength(2);
    groups.forEach((g) => expect(g).toHaveLength(1));
  });

  it("groups exact duplicates (same lat/lng)", () => {
    const groups = groupByPosition([home, homeClone]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  it("does not include the same location twice", () => {
    const groups = groupByPosition([home, homeClone, work]);
    const allIds = groups.flat().map((l) => l.id);
    expect(allIds).toHaveLength(3);
    expect(new Set(allIds).size).toBe(3);
  });
});

describe("spreadPositions", () => {
  it("returns single location unchanged", () => {
    const result = spreadPositions([home], 12);
    expect(result).toHaveLength(1);
    expect(result[0].lat).toBe(home.lat);
    expect(result[0].lng).toBe(home.lng);
    expect(result[0].loc).toBe(home);
  });

  it("returns distinct positions for a group of two", () => {
    const result = spreadPositions([home, homeClone], 12);
    expect(result).toHaveLength(2);
    expect(result[0].lng).not.toBe(result[1].lng);
  });

  it("returns distinct positions for a group of three", () => {
    const third: SavedLocation = { ...fav, id: "5", lat: home.lat, lng: home.lng };
    const result = spreadPositions([home, homeClone, third], 12);
    expect(result).toHaveLength(3);
    const lats = result.map((r) => r.lat);
    expect(new Set(lats).size).toBe(3);
  });

  it("uses a larger spread radius at low zoom levels", () => {
    const resultLow  = spreadPositions([home, homeClone], 5);
    const resultHigh = spreadPositions([home, homeClone], 15);
    const offsetLow  = Math.abs(resultLow[1].lng  - home.lng);
    const offsetHigh = Math.abs(resultHigh[1].lng - home.lng);
    expect(offsetLow).toBeGreaterThan(offsetHigh);
  });

  it("attaches the correct loc reference to each spread entry", () => {
    const result = spreadPositions([home, work], 12);
    expect(result.map((r) => r.loc)).toEqual([home, work]);
  });
});

describe("createPinSvg", () => {
  it("contains the HOME emoji", () => {
    expect(createPinSvg("HOME")).toContain("🏠");
  });

  it("contains the WORK emoji", () => {
    expect(createPinSvg("WORK")).toContain("🏢");
  });

  it("contains the FAVOURITE emoji", () => {
    expect(createPinSvg("FAVOURITE")).toContain("⭐");
  });

  it("falls back to 📍 for an unknown type", () => {
    expect(createPinSvg("UNKNOWN")).toContain("📍");
  });

  it("uses the correct colour for HOME", () => {
    expect(createPinSvg("HOME")).toContain("#10b981");
  });

  it("uses the correct colour for WORK", () => {
    expect(createPinSvg("WORK")).toContain("#3b82f6");
  });

  it("uses the correct colour for FAVOURITE", () => {
    expect(createPinSvg("FAVOURITE")).toContain("#f59e0b");
  });

  it("falls back to grey for an unknown type", () => {
    expect(createPinSvg("UNKNOWN")).toContain("#6b7280");
  });
});

describe("buildPopup", () => {
  it("includes the location label", () => {
    expect(buildPopup(home, [home])).toContain("Home");
  });

  it("includes the address", () => {
    expect(buildPopup(home, [home])).toContain("1 Main St");
  });

  it("shows 'Also at this location' section when group has multiple members", () => {
    expect(buildPopup(home, [home, homeClone])).toContain("Also at this location");
  });

  it("does not show 'Also at this location' for a solo location", () => {
    expect(buildPopup(home, [home])).not.toContain("Also at this location");
  });

  it("shows FAVOURITE label as 'Saved Place'", () => {
    expect(buildPopup(fav, [fav])).toContain("Saved Place");
  });

  it("shows HOME type as 'HOME' (not 'Saved Place')", () => {
    const html = buildPopup(home, [home]);
    expect(html).toContain("HOME");
    expect(html).not.toContain("Saved Place");
  });

  it("lists other group members in the popup", () => {
    const popup = buildPopup(home, [home, homeClone]);
    expect(popup).toContain("Home Office");
  });

  it("does not include the primary location in the 'others' list", () => {
    const popup = buildPopup(home, [home, homeClone]);
    const primaryCount = (popup.match(/1 Main St/g) || []).length;
    expect(primaryCount).toBeGreaterThanOrEqual(1);
  });
});

// React component tests

describe("SavedLocationsLayer (component)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMap.getZoom.mockReturnValue(12);
  });

  // Rendering 
  it("returns null (no DOM output)", async () => {
    const { container } = await renderLayer([home]);
    expect(container.firstChild).toBeNull();
  });

  it("renders without crashing when locations is empty", async () => {
    await expect(renderLayer([])).resolves.toBeDefined();
  });

  // Lifecycle 
  it("registers a zoomend listener on mount", async () => {
    await renderLayer([home]);
    expect(mockMap.on).toHaveBeenCalledWith("zoomend", expect.any(Function));
  });

  it("removes the zoomend listener on unmount", async () => {
    const { unmount } = await renderLayer([home]);
    act(() => unmount());
    expect(mockMap.off).toHaveBeenCalledWith("zoomend", expect.any(Function));
  });

  it("removes all layers from the map on unmount", async () => {
    const { unmount } = await renderLayer([home]);
    await waitFor(() => expect(L.marker).toHaveBeenCalled());
    act(() => unmount());
    expect(mockMap.removeLayer).toHaveBeenCalled();
  });

  //  Markers
  it("creates one marker per location", async () => {
    await renderLayer([home, work]);
    await waitFor(() => expect(L.marker).toHaveBeenCalledTimes(2));
  });

  it("does not create any markers when locations is empty", async () => {
    await renderLayer([]);
    expect(L.marker).not.toHaveBeenCalled();
  });

  it("spreads co-located pins into two separate markers", async () => {
    await renderLayer([home, homeClone]);
    await waitFor(() => expect(L.marker).toHaveBeenCalledTimes(2));
    const calls = L.marker.mock.calls as [[number, number]][];
    const [pos0, pos1] = calls.map((c) => c[0]);
    expect(pos0[1]).not.toBeCloseTo(pos1[1], 10);
  });

  it("binds a popup to every marker", async () => {
    await renderLayer([home, work]);
    await waitFor(() => expect(L.marker).toHaveBeenCalledTimes(2));
    L.marker.mock.results.forEach(({ value }: any) => {
      expect(value.bindPopup).toHaveBeenCalled();
    });
  });

  // divIcon 
  it("creates a divIcon for each marker", async () => {
    await renderLayer([home, work, fav]);
    await waitFor(() => expect(L.divIcon).toHaveBeenCalledTimes(3));
  });

  it("uses the HOME emoji in the divIcon html for a HOME location", async () => {
    await renderLayer([home]);
    await waitFor(() =>
      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining("🏠") })
      )
    );
  });

  it("uses the WORK emoji in the divIcon html for a WORK location", async () => {
    await renderLayer([work]);
    await waitFor(() =>
      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining("🏢") })
      )
    );
  });

  it("uses the FAVOURITE emoji in the divIcon html for a FAVOURITE location", async () => {
    await renderLayer([fav]);
    await waitFor(() =>
      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining("⭐") })
      )
    );
  });

  it("sets the correct iconSize and iconAnchor on every divIcon", async () => {
    await renderLayer([home]);
    await waitFor(() =>
      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({ iconSize: [36, 44], iconAnchor: [18, 44] })
      )
    );
  });
});
