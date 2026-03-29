import { renderHook, waitFor } from "@testing-library/react";
import { useAdminStats } from "../useAdminStats";

global.fetch = jest.fn();

describe("useAdminStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns default stats initially and updates after fetch", async () => {
    const mockStats = {
      totalUsers: 10,
      totalReports: 5,
      totalAppeals: 2,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => mockStats,
    });

    const { result } = renderHook(() => useAdminStats());

    // initial state
    expect(result.current).toEqual({
      totalUsers: 0,
      totalReports: 0,
      totalAppeals: 0,
    });

    // wait for state update
    await waitFor(() => {
      expect(result.current).toEqual(mockStats);
    });

    expect(fetch).toHaveBeenCalledWith("/api/admin/stats");
  });
});