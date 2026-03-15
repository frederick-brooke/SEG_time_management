import { renderHook, waitFor } from "@testing-library/react";
import { useAdminAppeals } from "../useAdminAppeals";

global.fetch = jest.fn();

describe("useAdminAppeals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches appeals successfully", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        appeals: [{ id: "1" }],
        totalAppealPages: 3,
        totalAppeals: 25,
      }),
    });

    const { result } = renderHook(() =>
      useAdminAppeals({ page: "1", limit: "10" })
    );

    await waitFor(() => {
      expect(result.current.appealLoading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/appeals?page=1&limit=10"
    );

    expect(result.current.appeals).toEqual([{ id: "1" }]);
    expect(result.current.totalAppealPages).toBe(3);
    expect(result.current.totalAppeals).toBe(25);
  });

  it("handles failed fetch", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    const { result } = renderHook(() =>
      useAdminAppeals({ page: "1" })
    );

    await waitFor(() => {
      expect(result.current.appealLoading).toBe(false);
    });

    expect(result.current.appeals).toEqual([]);
  });

  it("handles fetch error", async () => {
    (fetch as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    const { result } = renderHook(() =>
      useAdminAppeals({ page: "1" })
    );

    await waitFor(() => {
      expect(result.current.appealLoading).toBe(false);
    });

    expect(result.current.appeals).toEqual([]);
  });

  it("refetches when filters change", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        appeals: [],
        totalAppealPages: 1,
        totalAppeals: 0,
      }),
    });

    const { rerender } = renderHook(
      ({ filters }) => useAdminAppeals(filters),
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