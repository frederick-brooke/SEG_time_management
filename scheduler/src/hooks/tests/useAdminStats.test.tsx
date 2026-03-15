import { renderHook, waitFor } from "@testing-library/react";
import { useUsers } from "../useUsers";

global.fetch = jest.fn();

describe("useUsers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches users successfully", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [{ id: "u1" }],
        totalUserPages: 4,
        totalUsers: 100,
      }),
    });

    const { result } = renderHook(() =>
      useUsers({ page: "1", limit: "10" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/users?page=1&limit=10"
    );

    expect(result.current.users).toEqual([{ id: "u1" }]);
    expect(result.current.totalUserPages).toBe(4);
    expect(result.current.totalUsers).toBe(100);
  });

  it("uses fallback defaults when data missing", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}), // empty response
    });

    const { result } = renderHook(() =>
      useUsers({ page: "1" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.totalUserPages).toBe(1);
    expect(result.current.totalUsers).toBe(0);
  });

  it("handles non-ok response", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Bad request" }),
    });

    const { result } = renderHook(() =>
      useUsers({ page: "1" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.users).toEqual([]);
  });

  it("handles fetch rejection", async () => {
    (fetch as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    const { result } = renderHook(() =>
      useUsers({ page: "1" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.users).toEqual([]);
  });

  it("refetches when filters change", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [],
        totalUserPages: 1,
        totalUsers: 0,
      }),
    });

    const { rerender } = renderHook(
      ({ filters }) => useUsers(filters),
      {
        initialProps: { filters: { page: "1" } },
      }
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    rerender({ filters: { page: "2" } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});