import { render, screen, fireEvent } from "@testing-library/react";
import ReportManagement from "../ReportManagement";
import { Button } from "@/components/ui/Button";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Capture props passed into AdminListSection
let capturedProps: any;

jest.mock("../AdminListSection", () => (props: any) => {
  capturedProps = props;
  return <div data-testid="AdminListSection" />;
});

jest.mock("@/components/admin/AdminReportPanel", () => (props: any) => (
  <div data-testid="report-panel">
    <Button onClick={props.onClose}>ClosePanel</Button>
  </div>
));

describe("ReportManagement", () => {
  const setIsReportFilterOpen = jest.fn();
  const setSelectedReport = jest.fn();
  const fetchReports = jest.fn();
  const setFilters = jest.fn();
  const resetFilters = jest.fn();

  const reports = [
    { id: 1, status: "PENDING" },
    { id: 2, status: "RESOLVED" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <ReportManagement
        reports={reports}
        totalReports={2}
        totalReportPages={1}
        setIsReportFilterOpen={setIsReportFilterOpen}
        selectedReport={reports[0]}
        setSelectedReport={setSelectedReport}
        fetchReports={fetchReports}
        filters={{}}
        setFilters={setFilters}
        resetFilters={resetFilters}
      />
    );

  test("passes correct props into AdminListSection", () => {
    renderComponent();

    expect(capturedProps.title).toBe("Reports Management");
    expect(capturedProps.items).toBe(reports);
    expect(capturedProps.totalItems).toBe(2);
    expect(capturedProps.totalPages).toBe(1);
    expect(capturedProps.itemLabel).toBe("reports");
  });

  test("onFilterOpen triggers setIsReportFilterOpen", () => {
    renderComponent();
    capturedProps.onFilterOpen();
    expect(setIsReportFilterOpen).toHaveBeenCalledWith(true);
  });

  test("renderItem renders report and click selects it", () => {
    renderComponent();

    const item = capturedProps.renderItem(reports[0], 0);
    render(item);

    expect(screen.getByText("ID: 1")).toBeInTheDocument();
    expect(screen.getByText("Status: PENDING")).toBeInTheDocument();

    fireEvent.click(screen.getByText("ID: 1"));
    expect(setSelectedReport).toHaveBeenCalledWith(reports[0]);
  });

  test("renderPanel renders ReportPanel and close clears selection", () => {
    renderComponent();

    const panel = capturedProps.renderPanel();
    render(panel);

    fireEvent.click(screen.getByText("ClosePanel"));
    expect(setSelectedReport).toHaveBeenCalledWith(null);
  });
});