/**
 * Testing for lib/map/useFriends
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useFriends, validateFriendsResponse } from "../useFriends";
import { Friend } from "../types";

// Mock fetch
global.fetch = jest.fn();

// Fixtures

const mockFriend: Friend = {
  id: "1",
  username: "john",
  name: "John Doe",
  city: "London",
  country: "UK",
  location: { lat: 51.5074, lng: -0.1278 },
  pfp: "https://example.com/pfp.jpg",
  equippedAvatar: "avatar1",
};

const mockFriends: Friend[] = [mockFriend];

// Setup / Teardown

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockReset();
});

// Tests

describe("useFriends", () => {
  it("starts in loading state with no friends or error", () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = renderHook(() => useFriends());
    expect(result.current.loading).toBe(true);
    expect(result.current.friends).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("fetches and sets friends on successful API call", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFriends,
    });

    const { result } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.friends).toEqual(mockFriends);
    expect(result.current.error).toBeNull();
  });

  it("handles multiple friends from API", async () => {
    const multipleFriends = [
      mockFriend,
      {
        ...mockFriend,
        id: "2",
        username: "jane",
        name: "Jane Doe",
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => multipleFriends,
    });

    const { result } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.friends).toEqual(multipleFriends);
    expect(result.current.friends).toHaveLength(2);
  });

  it("handles 401 unauthorized response gracefully", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.friends).toEqual([]);
    expect(result.current.error).toBeNull(); // No error for 401
  });

  it("sets error and empty friends array on API error", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.friends).toEqual([]);
    expect(result.current.error).toContain("Failed to fetch friends");
    consoleSpy.mockRestore();
  });

  it("handles network error", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

    const { result } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.friends).toEqual([]);
    expect(result.current.error).toBe("Network error");
    consoleSpy.mockRestore();
  });

  it("calls /api/friends endpoint on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFriends,
    });

    renderHook(() => useFriends());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/friends");
    });
  });

  it("calls /api/friends endpoint only once on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFriends,
    });

    const { rerender } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    rerender();
    rerender();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("handles empty friends array from API", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useFriends());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.friends).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});

describe("validateFriendsResponse", () => {
  it("returns parsed JSON for successful response", async () => {
    const mockResponse = {
      ok: true,
      json: async () => mockFriends,
    } as Response;

    const result = await validateFriendsResponse(mockResponse);
    expect(result).toEqual(mockFriends);
  });

  it("returns empty array for 401 unauthorized", async () => {
    const mockResponse = {
      ok: false,
      status: 401,
    } as Response;

    const result = await validateFriendsResponse(mockResponse);
    expect(result).toEqual([]);
  });

  it("throws error for 500 server error", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    } as Response;

    await expect(validateFriendsResponse(mockResponse)).rejects.toThrow(
      "Failed to fetch friends: 500"
    );
  });

  it("throws error for 403 forbidden", async () => {
    const mockResponse = {
      ok: false,
      status: 403,
    } as Response;

    await expect(validateFriendsResponse(mockResponse)).rejects.toThrow(
      "Failed to fetch friends: 403"
    );
  });

  it("throws error for 404 not found", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
    } as Response;

    await expect(validateFriendsResponse(mockResponse)).rejects.toThrow(
      "Failed to fetch friends: 404"
    );
  });

  it("returns empty array for successful response with no friends", async () => {
    const mockResponse = {
      ok: true,
      json: async () => [],
    } as Response;

    const result = await validateFriendsResponse(mockResponse);
    expect(result).toEqual([]);
  });
});
