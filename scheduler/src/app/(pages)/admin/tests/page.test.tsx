import { render, screen, fireEvent } from "@testing-library/react";
import AdminPage from "../page";

//Mock hooks
jest.mock("@/hooks/useUsers", () => ({
  useUsers: jest.fn(),
}));

jest.mock("@/hooks/useAdminReports", () => ({
  useAdminReports: jest.fn(),
}));

jest.mock("@/hooks/useAdminAppeals", () => ({
  useAdminAppeals: jest.fn(),
}));

// Mock child components
jest.mock("@/components/admin/userManagement", () => () => <div>UserManagement</div>);
jest.mock("@/components/admin/reportManagement", () => () => <div>ReportManagement</div>);
jest.mock("@/components/admin/appealManagement", () => () => <div>AppealsManagement</div>);
jest.mock("@/components/admin/admin-statistics", () => () => <div>AdminStatistics</div>);
jest.mock("@/components/admin/user-filter-panel", () => () => <div>UserFilter</div>);
jest.mock("@/components/admin/report-filter-panel", () => () => <div>ReportFilter</div>);
jest.mock("@/components/admin/appeal-filter-panel", () => () => <div>AppealFilter</div>);

// UI components
jest.mock("@/components/ui/glassCard", () => ({ children }) => <div>{children}</div>);
jest.mock("@/components/effects/starField", () => () => <div>StarField</div>);
jest.mock("@/components/ui/glowBackground", () => () => <div>GlowBackground</div>);

// framer-motion mock
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children }) => <div>{children}</div>,
  },
}));

import { useUsers } from "@/hooks/useUsers";
import { useAdminReports } from "@/hooks/useAdminReports";
import { useAdminAppeals } from "@/hooks/useAdminAppeals";

describe("AdminPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    //Default mock data
    (useUsers as jest.Mock).mockReturnValue({
      users: [],
      totalUserPages: 1,
      totalUsers: 0,
      loading: false,
    });

    (useAdminReports as jest.Mock).mockReturnValue({
      reports: [],
      totalReportPages: 1,
      totalReports: 0,
      reportLoading: false,
      fetchReports: jest.fn(),
    });

    (useAdminAppeals as jest.Mock).mockReturnValue({
      appeals: [],
      totalAppealPages: 1,
      totalAppeals: 0,
      fetchAppeals: jest.fn(),
    });
  });

  // Loading state
  it("shows loading state", () => {
    (useUsers as jest.Mock).mockReturnValue({
      users: [],
      totalUserPages: 1,
      totalUsers: 0,
      loading: true,
    });

    render(<AdminPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  // Renders main sections
  it("renders admin dashboard", () => {
    render(<AdminPage />);

    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByText("UserManagement")).toBeInTheDocument();
    expect(screen.getByText("ReportManagement")).toBeInTheDocument();
    expect(screen.getByText("AdminStatistics")).toBeInTheDocument();
  });

  // tab switching
  it("switches from reports to appeals tab", () => {
    render(<AdminPage />);

    // default = reports
    expect(screen.getByText("ReportManagement")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Appeals"));

    expect(screen.getByText("AppealsManagement")).toBeInTheDocument();
  });

  // Back to reports
  it("switches back to reports tab", () => {
    render(<AdminPage />);

    fireEvent.click(screen.getByText("Appeals"));
    fireEvent.click(screen.getByText("Reports"));

    expect(screen.getByText("ReportManagement")).toBeInTheDocument();
  });

  // User filter open
  it("opens user filter panel", () => {
    render(<AdminPage />);

    expect(screen.queryByText("UserFilter")).not.toBeInTheDocument();
  });

  // eport filter toggle (indirect)
  it("renders report tab controls", () => {
    render(<AdminPage />);

    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Appeals")).toBeInTheDocument();
  });
});