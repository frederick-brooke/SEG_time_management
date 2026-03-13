import { renderHook, waitFor, act } from "@testing-library/react";
import { useUsers } from "../useUsers";

global.fetch = jest.fn();

describe("useUsers hook", () => {
  const endpoint = "/api/admin/users";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches users successfully on mount", async () => {
    const mockUsers = [{ id: "1", name: "Alice" }];

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        users: mockUsers,
        totalUserPages: 3,
        totalUsers: 15,
      }),
    });

    const { result } = renderHook(() =>
      useUsers({ page: "1", limit: "10" }, endpoint)
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/users?page=1&limit=10"
    );

    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.totalUserPages).toBe(3);
    expect(result.current.totalUsers).toBe(15);
  });

  test("uses fallback defaults when response fields are missing", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() =>
      useUsers({ page: "1" }, endpoint)
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.totalUserPages).toBe(1);
    expect(result.current.totalUsers).toBe(0);
  });

  test("handles API error when response is not ok", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Bad request" }),
    });

    const { result } = renderHook(() =>
      useUsers({ page: "1" }, endpoint)
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(result.current.users).toEqual([]);
  });

  test("handles fetch network failure", async () => {
    fetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useUsers({ page: "1" }, endpoint)
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(result.current.users).toEqual([]);
  });

  test("refetches when filters change", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [],
        totalUserPages: 1,
        totalUsers: 0,
      }),
    });

    const { rerender } = renderHook(
      ({ filters }) => useUsers(filters, endpoint),
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

  test("manual fetchUsers call works", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [{ id: "5", name: "Manual User" }],
        totalUserPages: 1,
        totalUsers: 1,
      }),
    });

    const { result } = renderHook(() =>
      useUsers({}, endpoint)
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.current.users[0].name).toBe("Manual User");
  });
});