/**
 * @file useSearchData.test.ts
 * @description Tests for useSearchData hook.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useSearchData } from "@/hooks/useSearchData";

// Mock data
const FRIENDS = [
  { id: "u-1", username: "alice" },
  { id: "u-2", username: "bob" },
];

const CONVERSATIONS = [
  { id: "g-1", isGroup: true },
  { id: "g-2", isGroup: true },
  { id: "c-1", isGroup: false }, // should be filtered out
];

describe("useSearchData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockFetch({
    friends = FRIENDS,
    conversations = CONVERSATIONS,
    failFriends = false,
    failConversations = false,
  }: {
    friends?: any[];
    conversations?: any[];
    failFriends?: boolean;
    failConversations?: boolean;
  } = {}) {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/user/search") {
        if (failFriends) return Promise.reject(new Error("friends failed"));
        return Promise.resolve({
          json: async () => friends,
        });
      }

      if (url === "/api/conversations") {
        if (failConversations) return Promise.reject(new Error("groups failed"));
        return Promise.resolve({
          json: async () => conversations,
        });
      }

      return Promise.reject(new Error("unknown endpoint"));
    });
  }

  it("fetches friends and groups on mount", async () => {
    mockFetch();

    renderHook(() => useSearchData());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/user/search");
      expect(global.fetch).toHaveBeenCalledWith("/api/conversations");
    });
  });

  it("sets friends state correctly", async () => {
    mockFetch();

    const { result } = renderHook(() => useSearchData());

    await waitFor(() => {
      expect(result.current.friends).toEqual(FRIENDS);
    });
  });

  it("filters only group conversations", async () => {
    mockFetch();

    const { result } = renderHook(() => useSearchData());

    await waitFor(() => {
      expect(result.current.groups).toEqual([
        { id: "g-1", isGroup: true },
        { id: "g-2", isGroup: true },
      ]);
    });
  });

  it("handles friends fetch failure gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetch({ failFriends: true });

    const { result } = renderHook(() => useSearchData());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch friends",
        expect.any(Error)
      );
      expect(result.current.friends).toEqual([]);
    });

    consoleSpy.mockRestore();
  });

  it("handles conversations fetch failure gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetch({ failConversations: true });

    const { result } = renderHook(() => useSearchData());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch groups",
        expect.any(Error)
      );
      expect(result.current.groups).toEqual([]);
    });

    consoleSpy.mockRestore();
  });

  it("does not crash if both fetches fail", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetch({ failFriends: true, failConversations: true });

    const { result } = renderHook(() => useSearchData());

    await waitFor(() => {
      expect(result.current.friends).toEqual([]);
      expect(result.current.groups).toEqual([]);
    });

    consoleSpy.mockRestore();
  });
});