import { renderHook, waitFor, act } from "@testing-library/react";
import { useAdminAppeals } from "../useAdminAppeals";

global.fetch = jest.fn();
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("useAdminAppeals hook", () => {
  const mockFilters = { status: "pending" };
  const mockResponse = {
    appeals:          [{ id: 1, reason: "Test appeal" }],
    totalAppealPages: 3,
    totalAppeals:     10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  Initial state 
  test("returns initial state correctly", () => {
    // Freeze fetch so loading stays true for the synchronous check
    mockedFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAdminAppeals(mockFilters));

    expect(result.current.appeals).toEqual([]);
    expect(result.current.appealLoading).toBe(true);
  });

  // Successful fetch 
  test("fetchAppeals updates state on successful fetch", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useAdminAppeals(mockFilters));

    await waitFor(() => expect(result.current.appealLoading).toBe(false));

    expect(mockedFetch).toHaveBeenCalledWith(
      "/api/admin/appeals?status=pending"
    );
    expect(result.current.appeals).toEqual(mockResponse.appeals);
    expect(result.current.totalAppealPages).toBe(3);
    expect(result.current.totalAppeals).toBe(10);
  });

  //  Non-ok response 
  test("fetchAppeals handles non-ok response", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    mockedFetch.mockResolvedValueOnce({ ok: false } as Response);

    const { result } = renderHook(() => useAdminAppeals(mockFilters));

    await waitFor(() => expect(result.current.appealLoading).toBe(false));

    expect(logSpy).toHaveBeenCalled();
    expect(result.current.appeals).toEqual([]);

    logSpy.mockRestore();
  });

  //  Network error 
  test("fetchAppeals handles fetch error gracefully", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockedFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAdminAppeals(mockFilters));

    await waitFor(() => expect(result.current.appealLoading).toBe(false));

    expect(errorSpy).toHaveBeenCalled();
    expect(result.current.appeals).toEqual([]);

    errorSpy.mockRestore();
  });

  //  Manual fetchAppeals 
  test("fetchAppeals can be called manually", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useAdminAppeals(mockFilters));

    await waitFor(() => expect(result.current.appealLoading).toBe(false));

    const manualData = {
      appeals:          [{ id: 2, reason: "Manual fetch" }],
      totalAppealPages: 1,
      totalAppeals:     1,
    };

    mockedFetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => manualData,
    } as Response);

    // Fire without awaiting inside act for waitFor observe the result
    act(() => { result.current.fetchAppeals(); });

    await waitFor(() => expect(result.current.appealLoading).toBe(false));

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(result.current.appeals).toEqual(manualData.appeals);
    expect(result.current.totalAppealPages).toBe(1);
    expect(result.current.totalAppeals).toBe(1);
  });

  //  Filters change triggers re-fetch 
  test("re-fetches when filters change", async () => {
    mockedFetch.mockResolvedValue({
      ok:   true,
      json: async () => mockResponse,
    } as Response);

    let filters = { status: "pending" };
    const { rerender } = renderHook(() => useAdminAppeals(filters));

    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));

    filters = { status: "resolved" };
    rerender();

    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2));
  });
});