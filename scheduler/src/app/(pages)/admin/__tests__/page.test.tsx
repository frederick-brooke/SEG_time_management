/**
 * Testing for admin page
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

// Mocks 

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
}));

jest.mock("@tabler/icons-react", () =>
  new Proxy({}, { get: () => () => null })
);

jest.mock("@/components/layout/LunarThemeWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/effects/StarField", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/ui/glowBackground", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/ui/glassCard", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/admin/AdminStatistics", () => ({
  __esModule: true,
  default: () => <div>AdminStatistics</div>,
}));

jest.mock("@/components/admin/UserManagement", () => ({
  __esModule: true,
  default: ({ setIsUserFilterOpen, resetFilters, setFilters }: any) => (
    <div>
      <div>UserManagement</div>
      <Button onClick={() => setIsUserFilterOpen(true)}>Open User Filter</Button>
      <Button onClick={() => resetFilters()}>Reset User Filters</Button>
      <Button onClick={() => setFilters({ sortBy: "email" })}>Set User Filters</Button>
    </div>
  ),
}));

jest.mock("@/components/admin/ReportManagement", () => ({
  __esModule: true,
  default: ({ setIsReportFilterOpen, resetFilters, setFilters }: any) => (
    <div>
      <div>ReportManagement</div>
      <Button onClick={() => setIsReportFilterOpen(true)}>Open Report Filter</Button>
      <Button onClick={() => resetFilters()}>Reset Report Filters</Button>
      <Button onClick={() => setFilters({ sortBy: "status" })}>Set Report Filters</Button>
    </div>
  ),
}));

jest.mock("@/components/admin/AppealManagement", () => ({
  __esModule: true,
  default: ({ setIsAppealFilterOpen, resetFilters, setFilters }: any) => (
    <div>
      <div>AppealsManagement</div>
      <Button onClick={() => setIsAppealFilterOpen(true)}>Open Appeal Filter</Button>
      <Button onClick={() => resetFilters()}>Reset Appeal Filters</Button>
      <Button onClick={() => setFilters({ sortBy: "date" })}>Set Appeal Filters</Button>
    </div>
  ),
}));

jest.mock("@/components/admin/UserFilterPanel", () => ({
  __esModule: true,
  default: ({ onClose, applyFilters, resetFilters, setFilters }: any) => (
    <div>
      <div>UserFilter</div>
      <Button onClick={onClose}>Close User Filter</Button>
      <Button onClick={applyFilters}>Apply User Filters</Button>
      <Button onClick={resetFilters}>Reset User Filter Panel</Button>
      <Button onClick={() => setFilters({ sortBy: "username" })}>Set User Draft Filters</Button>
    </div>
  ),
}));

jest.mock("@/components/admin/ReportFilterPanel", () => ({
  __esModule: true,
  default: ({ onClose, applyFilters, resetFilters, setFilters }: any) => (
    <div>
      <div>ReportFilter</div>
      <Button onClick={onClose}>Close Report Filter</Button>
      <Button onClick={applyFilters}>Apply Report Filters</Button>
      <Button onClick={resetFilters}>Reset Report Filter Panel</Button>
      <Button onClick={() => setFilters({ sortBy: "createdAt" })}>Set Report Draft Filters</Button>
    </div>
  ),
}));

jest.mock("@/components/admin/AppealFilterPanel", () => ({
  __esModule: true,
  default: ({ onClose, applyFilters, resetFilters, setFilters }: any) => (
    <div>
      <div>AppealFilter</div>
      <Button onClick={onClose}>Close Appeal Filter</Button>
      <Button onClick={applyFilters}>Apply Appeal Filters</Button>
      <Button onClick={resetFilters}>Reset Appeal Filter Panel</Button>
      <Button onClick={() => setFilters({ sortBy: "createdAt" })}>Set Appeal Draft Filters</Button>
    </div>
  ),
}));

const useUsersMock         = jest.fn();
const useAdminReportsMock  = jest.fn();
const useAdminAppealsMock  = jest.fn();

jest.mock("@/hooks/useUsers",        () => ({ useUsers:        (...a: any[]) => useUsersMock(...a) }));
jest.mock("@/hooks/useAdminReports", () => ({ useAdminReports: (...a: any[]) => useAdminReportsMock(...a) }));
jest.mock("@/hooks/useAdminAppeals", () => ({ useAdminAppeals: (...a: any[]) => useAdminAppealsMock(...a) }));

import AdminPage from "../page";

// Helpers 

function setupHooks({ loading = false, reportLoading = false } = {}) {
  useUsersMock.mockReturnValue({
    users: [],
    totalUserPages: 1,
    totalUsers: 0,
    loading,
  });
  useAdminReportsMock.mockReturnValue({
    reports: [],
    totalReportPages: 1,
    totalReports: 0,
    reportLoading,
    fetchReports: jest.fn(),
  });
  useAdminAppealsMock.mockReturnValue({
    appeals: [],
    totalAppealPages: 1,
    totalAppeals: 0,
    fetchAppeals: jest.fn(),
  });
}

// Tests

describe("AdminPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupHooks();
  });

  it("shows loading when users are loading", () => {
    setupHooks({ loading: true });
    render(<AdminPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows loading when reports are loading", () => {
    setupHooks({ reportLoading: true });
    render(<AdminPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the Admin Dashboard heading", () => {
    render(<AdminPage />);
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
  });

  it("renders AdminStatistics", () => {
    render(<AdminPage />);
    expect(screen.getByText("AdminStatistics")).toBeInTheDocument();
  });

  it("renders UserManagement", () => {
    render(<AdminPage />);
    expect(screen.getByText("UserManagement")).toBeInTheDocument();
  });

  it("shows ReportManagement by default", () => {
    render(<AdminPage />);
    expect(screen.getByText("ReportManagement")).toBeInTheDocument();
    expect(screen.queryByText("AppealsManagement")).not.toBeInTheDocument();
  });

  it("switches to AppealsManagement when Appeals tab is clicked", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Appeals"));
    expect(screen.getByText("AppealsManagement")).toBeInTheDocument();
    expect(screen.queryByText("ReportManagement")).not.toBeInTheDocument();
  });

  it("switches back to ReportManagement when Reports tab is clicked", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Appeals"));
    fireEvent.click(screen.getByText("Reports"));
    expect(screen.getByText("ReportManagement")).toBeInTheDocument();
    expect(screen.queryByText("AppealsManagement")).not.toBeInTheDocument();
  });
 
  it("opens UserFilter when triggered from UserManagement", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Open User Filter"));
    expect(screen.getByText("UserFilter")).toBeInTheDocument();
  });

  it("closes UserFilter via onClose", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Open User Filter"));
    fireEvent.click(screen.getByText("Close User Filter"));
    expect(screen.queryByText("UserFilter")).not.toBeInTheDocument();
  });

  it("applies user filters and closes the panel", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Open User Filter"));
    fireEvent.click(screen.getByText("Apply User Filters"));
    expect(screen.queryByText("UserFilter")).not.toBeInTheDocument();
  });

  it("resets user filters from the filter panel", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Open User Filter"));
    fireEvent.click(screen.getByText("Reset User Filter Panel"));
    expect(screen.getByText("UserFilter")).toBeInTheDocument();
  });

  it("sets draft user filters", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Open User Filter"));
    fireEvent.click(screen.getByText("Set User Draft Filters"));
    expect(screen.getByText("UserFilter")).toBeInTheDocument();
  });

  it("resets user filters from UserManagement", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Reset User Filters"));
    expect(screen.queryByText("UserFilter")).not.toBeInTheDocument();
  });

  it("sets user filters from UserManagement", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Set User Filters"));
    expect(screen.getByText("UserManagement")).toBeInTheDocument();
  });
 
  it("opens ReportFilter when triggered from ReportManagement", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Open Report Filter"));
    expect(screen.getByText("ReportFilter")).toBeInTheDocument();
  });

  it("closes ReportFilter via onClose", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Open Report Filter"));
    fireEvent.click(screen.getByText("Close Report Filter"));
    expect(screen.queryByText("ReportFilter")).not.toBeInTheDocument();
  });

  it("applies report filters and closes the panel", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Open Report Filter"));
    fireEvent.click(screen.getByText("Apply Report Filters"));
    expect(screen.queryByText("ReportFilter")).not.toBeInTheDocument();
  });

  it("resets report filters from the filter panel", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Open Report Filter"));
    fireEvent.click(screen.getByText("Reset Report Filter Panel"));
    expect(screen.getByText("ReportFilter")).toBeInTheDocument();
  });

  it("sets draft report filters", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Open Report Filter"));
    fireEvent.click(screen.getByText("Set Report Draft Filters"));
    expect(screen.getByText("ReportFilter")).toBeInTheDocument();
  });

  it("resets report filters from ReportManagement", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Reset Report Filters"));
    expect(screen.queryByText("ReportFilter")).not.toBeInTheDocument();
  });

  it("sets report filters from ReportManagement", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Set Report Filters"));
    expect(screen.getByText("ReportManagement")).toBeInTheDocument();
  });

  it("opens AppealFilter when triggered from AppealsManagement", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Appeals"));
    fireEvent.click(screen.getByText("Open Appeal Filter"));
    expect(screen.getByText("AppealFilter")).toBeInTheDocument();
  });

  it("closes AppealFilter via onClose", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Appeals"));
    fireEvent.click(screen.getByText("Open Appeal Filter"));
    fireEvent.click(screen.getByText("Close Appeal Filter"));
    expect(screen.queryByText("AppealFilter")).not.toBeInTheDocument();
  });

  it("applies appeal filters and closes the panel", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Appeals"));
    fireEvent.click(screen.getByText("Open Appeal Filter"));
    fireEvent.click(screen.getByText("Apply Appeal Filters"));
    expect(screen.queryByText("AppealFilter")).not.toBeInTheDocument();
  });

  it("resets appeal filters from the filter panel", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Appeals"));
    fireEvent.click(screen.getByText("Open Appeal Filter"));
    fireEvent.click(screen.getByText("Reset Appeal Filter Panel"));
    expect(screen.getByText("AppealFilter")).toBeInTheDocument();
  });

  it("sets draft appeal filters", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Appeals"));
    fireEvent.click(screen.getByText("Open Appeal Filter"));
    fireEvent.click(screen.getByText("Set Appeal Draft Filters"));
    expect(screen.getByText("AppealFilter")).toBeInTheDocument();
  });

  it("resets appeal filters from AppealsManagement", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Appeals"));
    fireEvent.click(screen.getByText("Reset Appeal Filters"));
    expect(screen.queryByText("AppealFilter")).not.toBeInTheDocument();
  });

  it("sets appeal filters from AppealsManagement", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("Appeals"));
    fireEvent.click(screen.getByText("Set Appeal Filters"));
    expect(screen.getByText("AppealsManagement")).toBeInTheDocument();
  });
});