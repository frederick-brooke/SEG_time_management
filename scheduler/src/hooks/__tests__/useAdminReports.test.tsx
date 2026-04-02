import { renderHook, waitFor, act } from "@testing-library/react";
import { useAdminReports } from "../useAdminReports";

const mockedFetch = jest
  .spyOn(global, "fetch")
  .mockImplementation(jest.fn()) as jest.MockedFunction<typeof fetch>;

describe("useAdminReports", () => {
  const mockResponse = {
    reports:              [{ id: "r1" }],
    totalPages:           5,
    totalMatchingReports: 42,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Initial state
  it("returns correct initial state", () => {
    mockedFetch.mockReturnValue(new Promise(() => {})); // freeze fetch

    const filters = { page: "1", limit: "10" };
    const { result } = renderHook(() => useAdminReports(filters));

    expect(result.current.reports).toEqual([]);
    expect(result.current.reportLoading).toBe(true);
  });

  // Successful fetch
  it("fetches reports successfully", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => mockResponse,
    } as Response);

    const filters = { page: "1", limit: "10" };
    const { result } = renderHook(() => useAdminReports(filters));

    await waitFor(() => expect(result.current.reportLoading).toBe(false));

    expect(mockedFetch).toHaveBeenCalledWith(
      "/api/admin/reports?page=1&limit=10"
    );
    expect(result.current.reports).toEqual([{ id: "r1" }]);
    expect(result.current.totalReportPages).toBe(5);
    expect(result.current.totalReports).toBe(42);
  });

  // Non-ok response
  it("handles non-ok response", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    mockedFetch.mockResolvedValueOnce({ ok: false } as Response);

    const filters = { page: "1" };
    const { result } = renderHook(() => useAdminReports(filters));

    await waitFor(() => expect(result.current.reportLoading).toBe(false));

    expect(result.current.reports).toEqual([]);

    logSpy.mockRestore();
  });

  // Network error
  it("handles fetch rejection", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockedFetch.mockRejectedValueOnce(new Error("Network error"));

    const filters = { page: "1" };
    const { result } = renderHook(() => useAdminReports(filters));

    await waitFor(() => expect(result.current.reportLoading).toBe(false));

    expect(errorSpy).toHaveBeenCalled();
    expect(result.current.reports).toEqual([]);

    errorSpy.mockRestore();
  });

  // Filters change triggers re-fetch 
  it("refetches when filters change", async () => {
    mockedFetch.mockResolvedValue({
      ok:   true,
      json: async () => ({
        reports:              [],
        totalPages:           1,
        totalMatchingReports: 0,
      }),
    } as Response);

    // initialProps keeps references stable between rerenders
    const { rerender } = renderHook(
      ({ filters }) => useAdminReports(filters),
      { initialProps: { filters: { page: "1" } } }
    );

    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));

    rerender({ filters: { page: "2" } });

    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2));
  });

  // Manual refetch
  it("manual fetchReports refetches and updates state", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => mockResponse,
    } as Response);

    const filters = { page: "1" };
    const { result } = renderHook(() => useAdminReports(filters));

    await waitFor(() => expect(result.current.reportLoading).toBe(false));

    const updatedData = {
      reports:              [{ id: "r2" }],
      totalPages:           2,
      totalMatchingReports: 1,
    };

    mockedFetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => updatedData,
    } as Response);

    act(() => { result.current.fetchReports(); });

    await waitFor(() => expect(result.current.reportLoading).toBe(false));

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(result.current.reports).toEqual([{ id: "r2" }]);
    expect(result.current.totalReportPages).toBe(2);
    expect(result.current.totalReports).toBe(1);
  });
});