import { renderHook, act, waitFor } from "@testing-library/react";

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { useSavedLocations } from "../useSavedLocations";


const makeLoc = (id: string, type: "HOME" | "WORK" | "FAVOURITE" = "HOME") => ({
  id,
  label: `Label ${id}`,
  address: `Address ${id}`,
  lat: 51.5,
  lng: -0.1,
  type,
});

const mockOkResponse = (data: any) =>
  Promise.resolve({ ok: true, json: async () => data });

const mockFailResponse = () =>
  Promise.resolve({ ok: false, json: async () => ({}) });


describe("useSavedLocations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue(mockOkResponse([]));
  });

  // Initial state
  it("starts with loading=true", () => {
    const { result } = renderHook(() => useSavedLocations());
    expect(result.current.loading).toBe(true);
  });

  it("starts with an empty locations array", () => {
    const { result } = renderHook(() => useSavedLocations());
    expect(result.current.locations).toEqual([]);
  });

  // Initial fetch
  it("fetches locations on mount", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([makeLoc("1")]));
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalledWith("/api/location/saved");
  });

  it("sets locations from the API response", async () => {
    const locs = [makeLoc("1"), makeLoc("2", "WORK")];
    mockFetch.mockResolvedValueOnce(mockOkResponse(locs));
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.locations).toEqual(locs);
  });

  it("sets loading=false after fetch completes", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets loading=false even when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce(mockFailResponse());
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("does not update locations when fetch response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFailResponse());
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.locations).toEqual([]);
  });

  // Derived values
  it("exposes home as the HOME type location", async () => {
    const home = makeLoc("h", "HOME");
    mockFetch.mockResolvedValueOnce(mockOkResponse([home]));
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.home).toEqual(home);
  });

  it("exposes home as null when no HOME location exists", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([makeLoc("1", "WORK")]));
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.home).toBeNull();
  });

  it("exposes work as the WORK type location", async () => {
    const work = makeLoc("w", "WORK");
    mockFetch.mockResolvedValueOnce(mockOkResponse([work]));
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.work).toEqual(work);
  });

  it("exposes work as null when no WORK location exists", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.work).toBeNull();
  });

  it("exposes favourites as all FAVOURITE type locations", async () => {
    const locs = [
      makeLoc("1", "FAVOURITE"),
      makeLoc("2", "FAVOURITE"),
      makeLoc("3", "HOME"),
    ];
    mockFetch.mockResolvedValueOnce(mockOkResponse(locs));
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.favourites).toHaveLength(2);
  });

  it("exposes empty favourites when none exist", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([makeLoc("1", "HOME")]));
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.favourites).toEqual([]);
  });

  // saveLocation
  it("POSTs to /api/location/saved when saving a location", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([])); // initial fetch
    mockFetch.mockResolvedValueOnce(mockOkResponse({})); // save
    mockFetch.mockResolvedValueOnce(mockOkResponse([])); // refresh after broadcast

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveLocation({
        label: "Home",
        address: "123 Main St",
        lat: 51.5,
        lng: -0.1,
        type: "HOME",
      });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/location/saved",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns true when saveLocation succeeds", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));
    mockFetch.mockResolvedValueOnce(mockOkResponse({}));
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.saveLocation({
        label: "Home", address: "123 Main St", lat: 51.5, lng: -0.1, type: "HOME",
      });
    });
    expect(returnVal).toBe(true);
  });

  it("returns false when saveLocation fails", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));
    mockFetch.mockResolvedValueOnce(mockFailResponse());

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.saveLocation({
        label: "Home", address: "123 Main St", lat: 51.5, lng: -0.1, type: "HOME",
      });
    });
    expect(returnVal).toBe(false);
  });

  // deleteLocation
  it("sends DELETE to the correct URL", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));
    mockFetch.mockResolvedValueOnce(mockOkResponse({}));
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteLocation("loc-1");
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/location/saved/loc-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("returns true when deleteLocation succeeds", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));
    mockFetch.mockResolvedValueOnce(mockOkResponse({}));
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.deleteLocation("loc-1");
    });
    expect(returnVal).toBe(true);
  });

  it("returns false when deleteLocation fails", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));
    mockFetch.mockResolvedValueOnce(mockFailResponse());

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.deleteLocation("loc-1");
    });
    expect(returnVal).toBe(false);
  });

  // renameLocation
  it("sends PATCH to the correct URL with the new label", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));
    mockFetch.mockResolvedValueOnce(mockOkResponse({}));
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.renameLocation("loc-1", "New Name");
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/location/saved/loc-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ label: "New Name" }),
      })
    );
  });

  it("returns true when renameLocation succeeds", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));
    mockFetch.mockResolvedValueOnce(mockOkResponse({}));
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.renameLocation("loc-1", "New Name");
    });
    expect(returnVal).toBe(true);
  });

  it("returns false when renameLocation fails", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));
    mockFetch.mockResolvedValueOnce(mockFailResponse());

    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let returnVal: boolean | undefined;
    await act(async () => {
      returnVal = await result.current.renameLocation("loc-1", "New Name");
    });
    expect(returnVal).toBe(false);
  });

  // broadcast / sync event
  it("re-fetches when saved-locations-updated event is dispatched", async () => {
    mockFetch.mockResolvedValue(mockOkResponse([]));
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const callsBefore = mockFetch.mock.calls.length;

    await act(async () => {
      window.dispatchEvent(new Event("saved-locations-updated"));
    });

    await waitFor(() =>
      expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore)
    );
  });

  // refresh
  it("refresh re-fetches and updates locations", async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse([]));
    const { result } = renderHook(() => useSavedLocations());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newLocs = [makeLoc("1", "HOME")];
    mockFetch.mockResolvedValueOnce(mockOkResponse(newLocs));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.locations).toEqual(newLocs);
  });
});
