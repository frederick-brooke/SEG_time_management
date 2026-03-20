import { renderHook, waitFor, act } from "@testing-library/react";
import { useUsers } from "../useUsers";

//assign jest.fn() FIRST, then capture the reference 
global.fetch = jest.fn();
const mockedFetch = global.fetch as jest.Mock;

describe("useUsers hook", () => {
  const mockUsers = [
    { id: 1, name: "Alice", role: "admin" },
    { id: 2, name: "Bob",   role: "user"  },
  ];

  // Default args 
  const defaultFilters  = { page: 1 };
  const defaultEndpoint = "/api/users";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Initial state 
  test("initial state is correct", () => {
    // Hang fetch so loading stays true during this synchronous check
    mockedFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() =>
      useUsers(defaultFilters, defaultEndpoint)
    );

    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  //  Successful fetch 
  test("fetchUsers loads users successfully", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => ({
        users:          mockUsers,
        totalUserPages: 3,
        totalUsers:     2,
      }),
    });

    const { result } = renderHook(() =>
      useUsers(defaultFilters, defaultEndpoint)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedFetch).toHaveBeenCalled();
    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.totalUserPages).toBe(3);
    expect(result.current.totalUsers).toBe(2);
  });

  //  API error response 
  test("handles fetch failure (ok: false)", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    mockedFetch.mockResolvedValueOnce({
      ok:   false,
      json: async () => ({ error: "Bad request" }),
    });

    const { result } = renderHook(() =>
      useUsers(defaultFilters, defaultEndpoint)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(logSpy).toHaveBeenCalled();
    expect(result.current.users).toEqual([]);

    logSpy.mockRestore();
  });

  //  Network / thrown error 
  test("handles fetch error (network throw)", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockedFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() =>
      useUsers(defaultFilters, defaultEndpoint)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(errorSpy).toHaveBeenCalled();
    expect(result.current.users).toEqual([]);

    errorSpy.mockRestore();
  });

  // Query string building 
  test("builds query string correctly — arrays, scalars, ignores empty/null", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => ({ users: [], totalUserPages: 1, totalUsers: 0 }),
    });

    renderHook(() =>
      useUsers(
        { role: ["ADMIN", "USER"], page: 2, empty: "", nullValue: null },
        "/api/users"
      )
    );

    await waitFor(() => expect(mockedFetch).toHaveBeenCalled());

    const url: string = mockedFetch.mock.calls[0][0];
    expect(url).toContain("role=ADMIN");
    expect(url).toContain("role=USER");
    expect(url).toContain("page=2");
    expect(url).not.toContain("empty=");
    expect(url).not.toContain("nullValue=");
  });

  // Manual fetchUsers call 
  test("manual fetchUsers refetches and updates state", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => ({ users: mockUsers, totalUserPages: 1, totalUsers: 2 }),
    });

    const { result } = renderHook(() =>
      useUsers(defaultFilters, defaultEndpoint)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const charlie = [{ id: 3, name: "Charlie", role: "user" }];

    mockedFetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => ({ users: charlie, totalUserPages: 1, totalUsers: 1 }),
    });

    act(() => { result.current.fetchUsers(); });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(result.current.users).toEqual(charlie);
  });

  test("re-fetches when filters change", async () => {
    mockedFetch.mockResolvedValue({
      ok:   true,
      json: async () => ({ users: [], totalUserPages: 1, totalUsers: 0 }),
    });

    let filters = { page: 1 };
    const { rerender } = renderHook(() =>
      useUsers(filters, defaultEndpoint)
    );

    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));

    filters = { page: 2 };
    rerender();

    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2));
  });
});