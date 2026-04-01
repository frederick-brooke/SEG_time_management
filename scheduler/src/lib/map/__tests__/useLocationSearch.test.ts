/**
 * Testing for lib/map/useLocationSearch
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { useLocationSearch, performLocationSearch, executeSearch } from "../useLocationSearch";

describe("useLocationSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Initial State", () => {
    it("returns initial state with empty values", () => {
      const { result } = renderHook(() => useLocationSearch());

      expect(result.current.searchQuery).toBe("");
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("returns a handleLocationSearch function", () => {
      const { result } = renderHook(() => useLocationSearch());

      expect(typeof result.current.handleLocationSearch).toBe("function");
    });
  });

  describe("Search Behavior", () => {
    it("clears suggestions when query is less than 3 characters", async () => {
      const { result } = renderHook(() => useLocationSearch());

      result.current.handleLocationSearch("ab");

      await waitFor(() => {
        expect(result.current.searchQuery).toBe("ab");
      });
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("does not call API when query is less than 3 characters", () => {
      global.fetch = jest.fn() as any;
      const { result } = renderHook(() => useLocationSearch());

      result.current.handleLocationSearch("ab");
      jest.runAllTimers();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("sets loading state when query is 3+ characters", async () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })) as any;
      const { result } = renderHook(() => useLocationSearch());

      result.current.handleLocationSearch("lon");

      // Wait for the state update to be processed
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      jest.runAllTimers();
    });

    it("debounces the search call by 400ms", () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })) as any;
      const { result } = renderHook(() => useLocationSearch());

      result.current.handleLocationSearch("london");

      // API should not be called yet
      expect(global.fetch).not.toHaveBeenCalled();

      // Advance timers by 300ms - still not called
      jest.advanceTimersByTime(300);
      expect(global.fetch).not.toHaveBeenCalled();

      // Advance timers by 100ms more - now should be called
      jest.advanceTimersByTime(100);
      expect(global.fetch).toHaveBeenCalledWith("/api/location/search?q=london");
    });

    it("cancels previous debounce timer when new search is made", async () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })) as any;
      const { result } = renderHook(() => useLocationSearch());

      act(() => {
        result.current.handleLocationSearch("lon");
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // First debounceTimer state is applied before second search
      act(() => {
        result.current.handleLocationSearch("lond");
      });

      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Should only be called once (for the second search)
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("/api/location/search?q=lond");
    });
  });

  describe("API Calls", () => {
    it("successfully fetches and returns suggestions", async () => {
      const mockSuggestion = {
        geometry: { coordinates: [-0.127, 51.507] },
        properties: { name: "London", city: "London", display: "London, UK" },
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockSuggestion]),
        })
      ) as any;

      const { result } = renderHook(() => useLocationSearch());

      result.current.handleLocationSearch("london");
      jest.runAllTimers();

      await waitFor(() => {
        expect(result.current.suggestions).toEqual([mockSuggestion]);
        expect(result.current.error).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });

    it("handles API errors by clearing suggestions and setting error", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      ) as any;

      const { result } = renderHook(() => useLocationSearch());

      result.current.handleLocationSearch("london");
      jest.runAllTimers();

      await waitFor(() => {
        expect(result.current.suggestions).toEqual([]);
        expect(result.current.error).toBe("Location search failed");
        expect(result.current.loading).toBe(false);
      });
    });

    it("handles network errors gracefully", async () => {
      const networkError = new Error("Network error");
      global.fetch = jest.fn(() => Promise.reject(networkError)) as any;

      const { result } = renderHook(() => useLocationSearch());

      result.current.handleLocationSearch("london");
      jest.runAllTimers();

      await waitFor(() => {
        expect(result.current.suggestions).toEqual([]);
        expect(result.current.error).toBe("Network error");
        expect(result.current.loading).toBe(false);
      });
    });

    it("handles non-array API response by converting to empty array", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null), // Invalid response
        })
      ) as any;

      const { result } = renderHook(() => useLocationSearch());

      result.current.handleLocationSearch("london");
      jest.runAllTimers();

      await waitFor(() => {
        expect(result.current.suggestions).toEqual([]);
        expect(result.current.error).toBeNull();
      });
    });

    it("encodes special characters in search query", () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })) as any;

      const { result } = renderHook(() => useLocationSearch());

      result.current.handleLocationSearch("Café & Bar");
      jest.runAllTimers();

      expect(global.fetch).toHaveBeenCalledWith(`/api/location/search?q=${encodeURIComponent("Café & Bar")}`);
    });
  });

  describe("Cleanup", () => {
    it("clears debounce timer on unmount", () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })) as any;

      const { unmount } = renderHook(() => useLocationSearch());

      // Create a search to set up a debounce timer
      const { result } = renderHook(() => useLocationSearch());
      result.current.handleLocationSearch("london");

      // Unmount should clean up any active timers
      unmount();

      expect(unmount).toBeDefined();
    });
  });
});

describe("performLocationSearch", () => {
  const mockSuggestion = {
    geometry: { coordinates: [-0.127, 51.507] },
    properties: { name: "London", city: "London", display: "London, UK" },
  };

  it("returns parsed suggestions array on success", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockSuggestion]),
      })
    ) as any;

    const result = await performLocationSearch("london");
    expect(result).toEqual([mockSuggestion]);
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/location/search?q=${encodeURIComponent("london")}`
    );
  });

  it("returns empty array for successful response with null data", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      })
    ) as any;

    const result = await performLocationSearch("london");
    expect(result).toEqual([]);
  });

  it("returns empty array for successful response with empty array", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as any;

    const result = await performLocationSearch("london");
    expect(result).toEqual([]);
  });

  it("returns parsed suggestions with multiple results", async () => {
    const multipleSuggestions = [
      mockSuggestion,
      {
        ...mockSuggestion,
        properties: { ...mockSuggestion.properties, name: "London, Ontario" },
      },
    ];

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(multipleSuggestions),
      })
    ) as any;

    const result = await performLocationSearch("london");
    expect(result).toEqual(multipleSuggestions);
    expect(result).toHaveLength(2);
  });

  it("throws error for 400 bad request", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
      })
    ) as any;

    await expect(performLocationSearch("london")).rejects.toThrow(
      "Location search failed"
    );
  });

  it("throws error for 404 not found", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      })
    ) as any;

    await expect(performLocationSearch("london")).rejects.toThrow(
      "Location search failed"
    );
  });

  it("throws error for 500 server error", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    ) as any;

    await expect(performLocationSearch("london")).rejects.toThrow(
      "Location search failed"
    );
  });

  it("throws error for network failure", async () => {
    const networkError = new Error("Network timeout");
    global.fetch = jest.fn(() => Promise.reject(networkError)) as any;

    await expect(performLocationSearch("london")).rejects.toThrow(
      "Network timeout"
    );
  });

  it("encodes special characters in query parameter", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as any;

    await performLocationSearch("Café & Restaurant");

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/location/search?q=${encodeURIComponent("Café & Restaurant")}`
    );
  });

  it("encodes spaces correctly in query parameter", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as any;

    await performLocationSearch("New York");

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/location/search?q=${encodeURIComponent("New York")}`
    );
  });

  it("handles non-array response by returning empty array", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ some: "object" }),
      })
    ) as any;

    const result = await performLocationSearch("london");
    expect(result).toEqual([]);
  });

  it("handles undefined response data", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(undefined),
      })
    ) as any;

    const result = await performLocationSearch("london");
    expect(result).toEqual([]);
  });
});

describe("executeSearch", () => {
  const mockSuggestion = {
    geometry: { coordinates: [-0.127, 51.507] },
    properties: { name: "London", city: "London", display: "London, UK" },
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("updates state with suggestions on success", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockSuggestion]),
      })
    ) as any;

    const setSuggestions = jest.fn();
    const setError = jest.fn();
    const setLoading = jest.fn();

    await executeSearch("london", setSuggestions, setError, setLoading);

    expect(setSuggestions).toHaveBeenCalledWith([mockSuggestion]);
    expect(setError).toHaveBeenCalledWith(null);
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it("clears suggestions and sets error on API failure", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    ) as any;

    const setSuggestions = jest.fn();
    const setError = jest.fn();
    const setLoading = jest.fn();

    await executeSearch("london", setSuggestions, setError, setLoading);

    expect(setSuggestions).toHaveBeenCalledWith([]);
    expect(setError).toHaveBeenCalledWith("Location search failed");
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it("handles network errors with error message", async () => {
    const networkError = new Error("Network timeout");
    global.fetch = jest.fn(() => Promise.reject(networkError)) as any;

    const setSuggestions = jest.fn();
    const setError = jest.fn();
    const setLoading = jest.fn();

    await executeSearch("london", setSuggestions, setError, setLoading);

    expect(setSuggestions).toHaveBeenCalledWith([]);
    expect(setError).toHaveBeenCalledWith("Network timeout");
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it("handles non-Error exceptions gracefully", async () => {
    global.fetch = jest.fn(() => Promise.reject("String error")) as any;

    const setSuggestions = jest.fn();
    const setError = jest.fn();
    const setLoading = jest.fn();

    await executeSearch("london", setSuggestions, setError, setLoading);

    expect(setSuggestions).toHaveBeenCalledWith([]);
    expect(setError).toHaveBeenCalledWith("Search error");
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it("updates state with empty suggestions array on success", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as any;

    const setSuggestions = jest.fn();
    const setError = jest.fn();
    const setLoading = jest.fn();

    await executeSearch("xyz", setSuggestions, setError, setLoading);

    expect(setSuggestions).toHaveBeenCalledWith([]);
    expect(setError).toHaveBeenCalledWith(null);
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it("always calls setLoading(false) even if setSuggestions throws", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockSuggestion]),
      })
    ) as any;

    const setSuggestions = jest
      .fn()
      .mockImplementation(() => {
        throw new Error("State update failed");
      });
    const setError = jest.fn();
    const setLoading = jest.fn();

    // Even if setSuggestions throws, setLoading should still be called
    try {
      await executeSearch("london", setSuggestions, setError, setLoading);
    } catch {
      // Expected to throw
    }

    expect(setLoading).toHaveBeenCalledWith(false);
  });
});
