import { renderHook, act, waitFor } from "@testing-library/react";
import { useSavedLocations } from "@/hooks/useSavedLocations";

// ── Mocks ──────────────────────────────────────────────────────────────────

global.fetch = jest.fn();

const mockLocations = [
  { id: "1", label: "Home", address: "1 Main St", lat: 51.5, lng: -0.1, type: "HOME" as const },
  { id: "2", label: "Work", address: "2 Work Ave", lat: 51.51, lng: -0.09, type: "WORK" as const },
  { id: "3", label: "Gym", address: "3 Gym Rd", lat: 51.52, lng: -0.08, type: "FAVOURITE" as const },
  { id: "4", label: "Park", address: "4 Park Lane", lat: 51.53, lng: -0.07, type: "FAVOURITE" as const },
];

function mockFetchOk(data: any) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => data,
  });
}

function mockFetchFail() {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchOk(mockLocations);
});

// ── Initial fetch ──────────────────────────────────────────────────────────

describe("initial fetch", () => {
  it("fetches locations on mount and sets loading false", async () => {
    const { result } = renderHook(() => useSavedLocations());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(global.fetch).toHaveBeenCalledWith("/api/location/saved");
    expect(result.current.locations).toEqual(mockLocations);
  });

  it("leaves locations empty when response is not ok", async () => {
    mockFetchFail();

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.locations).toEqual([]);
  });
});

// ── Derived values ─────────────────────────────────────────────────────────

describe("derived values", () => {
  it("exposes home as the HOME type location", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.home).toEqual(mockLocations[0]);
  });

  it("exposes work as the WORK type location", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.work).toEqual(mockLocations[1]);
  });

  it("exposes favourites as all FAVOURITE type locations", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.favourites).toEqual([mockLocations[2], mockLocations[3]]);
  });

  it("returns null for home when no HOME location exists", async () => {
    mockFetchOk([mockLocations[1]]); // only WORK

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.home).toBeNull();
  });

  it("returns null for work when no WORK location exists", async () => {
    mockFetchOk([mockLocations[0]]); // only HOME

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.work).toBeNull();
  });

  it("returns empty array for favourites when none exist", async () => {
    mockFetchOk([mockLocations[0], mockLocations[1]]); // HOME + WORK only

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.favourites).toEqual([]);
  });
});

// ── refresh() ─────────────────────────────────────────────────────────────

describe("refresh()", () => {
  it("re-fetches and updates locations", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updated = [mockLocations[0]];
    mockFetchOk(updated);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.locations).toEqual(updated);
  });

  it("sets loading true during refresh then false after", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchOk([]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.loading).toBe(false);
  });
});

// ── Cross-tab sync via custom event ───────────────────────────────────────

describe("SYNC_EVENT listener", () => {
  it("re-fetches when the saved-locations-updated event fires", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updated = [mockLocations[0]];
    mockFetchOk(updated);

    act(() => {
      window.dispatchEvent(new Event("saved-locations-updated"));
    });

    await waitFor(() => expect(result.current.locations).toEqual(updated));
  });

  it("removes the event listener on unmount", async () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useSavedLocations());
    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(0));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      "saved-locations-updated",
      expect.any(Function),
    );

    removeSpy.mockRestore();
  });
});

// ── saveLocation() ────────────────────────────────────────────────────────

describe("saveLocation()", () => {
  const payload = {
    label: "Coffee Shop",
    address: "5 Bean St",
    lat: 51.54,
    lng: -0.06,
    type: "FAVOURITE" as const,
  };

  it("POSTs to the API and returns true on success", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchOk([]);

    let ok: boolean;
    await act(async () => {
      ok = await result.current.saveLocation(payload);
    });

    expect(ok!).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/location/saved",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
  });

  it("broadcasts the sync event on success", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchOk([]);
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    await act(async () => {
      await result.current.saveLocation(payload);
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "saved-locations-updated" }),
    );
    dispatchSpy.mockRestore();
  });

  it("returns false and does not broadcast on failure", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchFail();
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    let ok: boolean;
    await act(async () => {
      ok = await result.current.saveLocation(payload);
    });

    expect(ok!).toBe(false);
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "saved-locations-updated" }),
    );
    dispatchSpy.mockRestore();
  });
});

// ── deleteLocation() ──────────────────────────────────────────────────────

describe("deleteLocation()", () => {
  it("sends DELETE to the correct URL and returns true on success", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchOk([]);

    let ok: boolean;
    await act(async () => {
      ok = await result.current.deleteLocation("1");
    });

    expect(ok!).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/location/saved/1",
      { method: "DELETE" },
    );
  });

  it("broadcasts the sync event on success", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchOk([]);
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    await act(async () => {
      await result.current.deleteLocation("1");
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "saved-locations-updated" }),
    );
    dispatchSpy.mockRestore();
  });

  it("returns false and does not broadcast on failure", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchFail();
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    let ok: boolean;
    await act(async () => {
      ok = await result.current.deleteLocation("1");
    });

    expect(ok!).toBe(false);
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "saved-locations-updated" }),
    );
    dispatchSpy.mockRestore();
  });
});

// ── renameLocation() ──────────────────────────────────────────────────────

describe("renameLocation()", () => {
  it("sends PATCH with new label and returns true on success", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchOk([]);

    let ok: boolean;
    await act(async () => {
      ok = await result.current.renameLocation("1", "New Home Label");
    });

    expect(ok!).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/location/saved/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ label: "New Home Label" }),
      }),
    );
  });

  it("broadcasts the sync event on success", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchOk([]);
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    await act(async () => {
      await result.current.renameLocation("1", "Updated");
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "saved-locations-updated" }),
    );
    dispatchSpy.mockRestore();
  });

  it("returns false and does not broadcast on failure", async () => {
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchFail();
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");

    let ok: boolean;
    await act(async () => {
      ok = await result.current.renameLocation("1", "Updated");
    });

    expect(ok!).toBe(false);
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "saved-locations-updated" }),
    );
    dispatchSpy.mockRestore();
  });
});