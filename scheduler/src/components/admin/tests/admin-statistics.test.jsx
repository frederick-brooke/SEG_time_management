import { render, screen } from "@testing-library/react";
import AdminStatistics from "../admin-statistics";

// Mock the hook
jest.mock("@/hooks/useAdminStats", () => ({
  useAdminStats: jest.fn(),
}));

// Mock GlassCard (just render children)
jest.mock("@/components/ui/glassCard", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children }) => <div>{children}</div>,
  },
}));

import { useAdminStats } from "@/hooks/useAdminStats";

describe("AdminStatistics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders statistics values correctly", () => {
    useAdminStats.mockReturnValue({
      totalUsers: 10,
      totalReports: 5,
      totalAppeals: 2,
    });

    render(<AdminStatistics />);

    expect(screen.getByText("Statistics")).toBeInTheDocument();

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("Total Reports")).toBeInTheDocument();
    expect(screen.getByText("Total Appeals")).toBeInTheDocument();
  });

  test("shows fallback '-' when values are null/undefined", () => {
    useAdminStats.mockReturnValue({
      totalUsers: null,
      totalReports: undefined,
      totalAppeals: 0,
    });

    render(<AdminStatistics />);

    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("0")).toBeInTheDocument(); // 0 should still show
  });
});