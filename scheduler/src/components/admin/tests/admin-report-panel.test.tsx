import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportPanel from "../admin-report-panel"; // adjust path if needed

global.fetch = jest.fn() as jest.Mock;
global.alert = jest.fn();

describe("ReportPanel", () => {
  const mockOnClose = jest.fn();
  const mockFetchReports = jest.fn();

  const report = {
    id: "r1",
    status: "PENDING",
    description: "Spam report",
    reportedUser: {
      id: "u1",
      username: "badUser",
      isBanned: false,
    },
    reportedBy: {
      username: "reporter",
    },
    handledBy: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders nothing if no report", () => {
    const { container } = render(
      <ReportPanel report={null} onClose={mockOnClose} fetchReports={mockFetchReports} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders report details", () => {
    render(
      <ReportPanel report={report} onClose={mockOnClose} fetchReports={mockFetchReports} />
    );

    expect(screen.getByText("Report Details")).toBeInTheDocument();
    expect(screen.getByText("r1")).toBeInTheDocument();
    expect(screen.getByText("badUser")).toBeInTheDocument();
    expect(screen.getByText("reporter")).toBeInTheDocument();
    expect(screen.getByText("Spam report")).toBeInTheDocument();
  });

  test("opens action modal when clicking Take Action", () => {
    render(
      <ReportPanel report={report} onClose={mockOnClose} fetchReports={mockFetchReports} />
    );

    fireEvent.click(screen.getByText("Take Action"));

    expect(screen.getByText("Report Action")).toBeInTheDocument();
  });

  test("temporary ban calls API and shows alert", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(
      <ReportPanel report={report} onClose={mockOnClose} fetchReports={mockFetchReports} />
    );

    fireEvent.click(screen.getByText("Take Action"));
    fireEvent.click(screen.getByText(/Temporary Ban/i));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/admin/users/${report.reportedUser.id}/ban`,
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });

    expect(alert).toHaveBeenCalledWith(
      `User ${report.reportedUser.username} Temporarily Banned`
    );
    expect(mockFetchReports).toHaveBeenCalled();
  });

  test("permanent ban shows correct alert", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(
      <ReportPanel report={report} onClose={mockOnClose} fetchReports={mockFetchReports} />
    );

    fireEvent.click(screen.getByText("Take Action"));
    fireEvent.click(screen.getByText(/Permanent Ban/i));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith(
        `User ${report.reportedUser.username} Permanently Banned`
      );
    });
  });

  test("unban shows correct alert", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(
      <ReportPanel report={report} onClose={mockOnClose} fetchReports={mockFetchReports} />
    );

    fireEvent.click(screen.getByText("Take Action"));
    fireEvent.click(screen.getByText(/Unban/i));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith(
        `User ${report.reportedUser.username} Unbanned`
      );
    });
  });

  test("close button triggers onClose", () => {
    render(
      <ReportPanel report={report} onClose={mockOnClose} fetchReports={mockFetchReports} />
    );

    fireEvent.click(screen.getByText("Close"));
    expect(mockOnClose).toHaveBeenCalled();
  });
});