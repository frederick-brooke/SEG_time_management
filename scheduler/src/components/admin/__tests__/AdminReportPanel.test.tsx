import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportPanel from "../AdminReportPanel"; // adjust path if needed

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
			<ReportPanel
				report={null}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);
		expect(container.firstChild).toBeNull();
	});

	test("renders report details", () => {
		render(
			<ReportPanel
				report={report}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		expect(screen.getByText("Report Details")).toBeInTheDocument();
		expect(screen.getByText("r1")).toBeInTheDocument();
		expect(screen.getByText("badUser")).toBeInTheDocument();
		expect(screen.getByText("reporter")).toBeInTheDocument();
		expect(screen.getByText("Spam report")).toBeInTheDocument();
	});

	test("opens action modal when clicking Take Action", () => {
		render(
			<ReportPanel
				report={report}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		fireEvent.click(screen.getByText("Take Action"));

		expect(screen.getByText("Report Action")).toBeInTheDocument();
	});

	test("temporary ban calls API and shows alert", async () => {
		(fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

		render(
			<ReportPanel
				report={report}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		fireEvent.click(screen.getByText("Take Action"));
		fireEvent.click(screen.getByText(/Temporary Ban/i));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				`/api/admin/users/${report.reportedUser.id}/ban`,
				expect.objectContaining({
					method: "PATCH",
				}),
			);
		});

		expect(alert).toHaveBeenCalledWith(
			`User ${report.reportedUser.username} Temporarily Banned`,
		);
		expect(mockFetchReports).toHaveBeenCalled();
	});

	test("permanent ban shows correct alert", async () => {
		(fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

		render(
			<ReportPanel
				report={report}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		fireEvent.click(screen.getByText("Take Action"));
		fireEvent.click(screen.getByText(/Permanent Ban/i));

		await waitFor(() => {
			expect(alert).toHaveBeenCalledWith(
				`User ${report.reportedUser.username} Permanently Banned`,
			);
		});
	});

	test("unban shows correct alert", async () => {
		(fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

		render(
			<ReportPanel
				report={report}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		fireEvent.click(screen.getByText("Take Action"));
		fireEvent.click(screen.getByText(/Unban/i));

		await waitFor(() => {
			expect(alert).toHaveBeenCalledWith(
				`User ${report.reportedUser.username} Unbanned`,
			);
		});
	});

	test("close button triggers onClose", () => {
		render(
			<ReportPanel
				report={report}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		fireEvent.click(screen.getByText("Close"));
		expect(mockOnClose).toHaveBeenCalled();
	});

	test("shows alert and does not call fetch when reported user id is missing", async () => {
		const reportWithoutUserId = {
			...report,
			reportedUser: {
				...report.reportedUser,
				id: undefined,
			},
		};

		render(
			<ReportPanel
				report={reportWithoutUserId}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		fireEvent.click(screen.getByText("Take Action"));
		fireEvent.click(screen.getByText(/Temporary Ban/i));

		await waitFor(() => {
			expect(alert).toHaveBeenCalledWith(
				"Cannot ban user: user ID is missing.",
			);
		});

		expect(fetch).not.toHaveBeenCalled();
		expect(mockFetchReports).not.toHaveBeenCalled();
	});

	test("renders resolved status, handled by user, and permanent ban text", () => {
		const resolvedReport = {
			...report,
			status: "RESOLVED",
			handledBy: { username: "moderator1" },
			reportedUser: {
				...report.reportedUser,
				isBanned: true,
				banExpires: null,
			},
		};

		render(
			<ReportPanel
				report={resolvedReport}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		expect(screen.getByText("RESOLVED")).toBeInTheDocument();
		expect(screen.getByText("moderator1")).toBeInTheDocument();
		expect(screen.getByText("Permanent")).toBeInTheDocument();
	});

	test("renders rejected status and hides Take Action when report is already handled", () => {
		const handledRejectedReport = {
			...report,
			status: "REJECTED",
			handledBy: { username: "adminUser" },
		};

		render(
			<ReportPanel
				report={handledRejectedReport}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		expect(screen.getByText("REJECTED")).toBeInTheDocument();
		expect(screen.getByText("adminUser")).toBeInTheDocument();
		expect(screen.queryByText("Take Action")).not.toBeInTheDocument();
	});

	test("clicking the backdrop closes the panel", () => {
		const { container } = render(
			<ReportPanel
				report={report}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		const backdrop = container.firstChild as HTMLElement;
		fireEvent.click(backdrop);

		expect(mockOnClose).toHaveBeenCalled();
	});
	test("permanent ban calls API, shows permanent alert, and refreshes reports", async () => {
		(fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

		render(
			<ReportPanel
				report={report}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		fireEvent.click(screen.getByText("Take Action"));
		fireEvent.click(screen.getByText(/Permanent Ban/i));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				`/api/admin/users/${report.reportedUser.id}/ban`,
				expect.objectContaining({
					method: "PATCH",
					body: JSON.stringify({
						type: "PERMANENT",
						durationDays: null,
						reportId: report.id,
					}),
				}),
			);
		});

		expect(alert).toHaveBeenCalledWith(
			`User ${report.reportedUser.username} Permanently Banned`,
		);
		expect(mockFetchReports).toHaveBeenCalled();
	});

	test("opens and closes the report action modal", () => {
		render(
			<ReportPanel
				report={report}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		expect(screen.queryByText("Report Action")).not.toBeInTheDocument();

		fireEvent.click(screen.getByText("Take Action"));
		expect(screen.getByText("Report Action")).toBeInTheDocument();

		fireEvent.click(screen.getByText("Cancel"));
		expect(screen.queryByText("Report Action")).not.toBeInTheDocument();
	});

	test("shows formatted ban expiry date when resolved report has a temporary ban", () => {
		const tempBannedReport = {
			...report,
			status: "RESOLVED",
			handledBy: { username: "moderator1" },
			reportedUser: {
				...report.reportedUser,
				isBanned: true,
				banExpires: "2030-01-10T12:00:00.000Z",
			},
		};

		render(
			<ReportPanel
				report={tempBannedReport}
				onClose={mockOnClose}
				fetchReports={mockFetchReports}
			/>,
		);

		const formatted = new Date("2030-01-10T12:00:00.000Z").toLocaleString();
		expect(screen.getByText(formatted)).toBeInTheDocument();
	});
});
