import { renderHook, waitFor } from "@testing-library/react";
import { useAdminReports } from "../useAdminReports";

global.fetch = jest.fn();

describe("useAdminReports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches reports successfully", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        reports: [{ id: "r1" }],
        totalPages: 5,
        totalMatchingReports: 42,
      }),
    });

    const { result } = renderHook(() =>
      useAdminReports({ page: "1", limit: "10" })
    );

    await waitFor(() => {
      expect(result.current.reportLoading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/reports?page=1&limit=10"
    );

    expect(result.current.reports).toEqual([{ id: "r1" }]);
    expect(result.current.totalReportPages).toBe(5);
    expect(result.current.totalReports).toBe(42);
  });

  it("handles non-ok response", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    const { result } = renderHook(() =>
      useAdminReports({ page: "1" })
    );

    await waitFor(() => {
      expect(result.current.reportLoading).toBe(false);
    });

    expect(result.current.reports).toEqual([]);
  });

  it("handles fetch rejection", async () => {
    (fetch as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    const { result } = renderHook(() =>
      useAdminReports({ page: "1" })
    );

    await waitFor(() => {
      expect(result.current.reportLoading).toBe(false);
    });

    expect(result.current.reports).toEqual([]);
  });

  it("refetches when filters change", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        reports: [],
        totalPages: 1,
        totalMatchingReports: 0,
      }),
    });

    const { rerender } = renderHook(
      ({ filters }) => useAdminReports(filters),
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