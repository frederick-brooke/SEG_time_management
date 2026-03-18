import { renderHook, waitFor, act } from "@testing-library/react";
import { useUsers } from "../useUsers";

global.fetch = jest.fn();

describe("useUsers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("successful fetch updates state", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [{ id: "1" }],
        totalUserPages: 2,
        totalUsers: 10,
      }),
    });

    const { result } = renderHook(() =>
      useUsers({ page: 1 }, "/api/users")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.users).toEqual([{ id: "1" }]);
    expect(result.current.totalUserPages).toBe(2);
    expect(result.current.totalUsers).toBe(10);
  });

  test("handles API error response", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Bad request" }),
    });

    const { result } = renderHook(() =>
      useUsers({ page: 1 }, "/api/users")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(logSpy).toHaveBeenCalled();
    expect(result.current.users).toEqual([]);
  });

  test("handles network error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    fetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useUsers({ page: 1 }, "/api/users")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(errorSpy).toHaveBeenCalled();
  });

  test("builds query with arrays and ignores empty values", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [],
        totalUserPages: 1,
        totalUsers: 0,
      }),
    });

    renderHook(() =>
      useUsers(
        { role: ["ADMIN", "USER"], page: 2, empty: "", nullValue: null },
        "/api/users"
      )
    );

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const url = fetch.mock.calls[0][0];

    expect(url).toContain("role=ADMIN");
    expect(url).toContain("role=USER");
    expect(url).toContain("page=2");
    expect(url).not.toContain("empty=");
    expect(url).not.toContain("nullValue=");
  });

  test("manual fetchUsers works", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [{ id: "2" }],
        totalUserPages: 1,
        totalUsers: 1,
      }),
    });

    const { result } = renderHook(() =>
      useUsers({ page: 1 }, "/api/users")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});