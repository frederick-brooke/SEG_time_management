import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AppealPanel from "../AdminAppealPanel";

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

const mockAppeal = {
	id: "123",
	status: "PENDING",
	message: "Please unban me",
	createdAt: new Date().toISOString(),
	user: { username: "testuser", email: "test@email.com" },
	report: { id: "report123" },
	handledBy: null,
};

describe("AppealPanel", () => {
	const onClose = jest.fn();
	const fetchAppeals = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	// 1. Null render
	it("renders nothing when appeal is null", () => {
		const { container } = render(
			<AppealPanel appeal={null} onClose={onClose} fetchAppeals={fetchAppeals} />
		);
		expect(container.firstChild).toBeNull();
	});

	// 2. Renders appeal info
	it("displays appeal information", () => {
		render(
			<AppealPanel appeal={mockAppeal} onClose={onClose} fetchAppeals={fetchAppeals} />
		);

		expect(screen.getByText("Appeal Details")).toBeInTheDocument();
		expect(screen.getByText("123")).toBeInTheDocument();
		expect(screen.getByText("testuser")).toBeInTheDocument();
		expect(screen.getByText("report123")).toBeInTheDocument();
		expect(screen.getByText("Not handled yet")).toBeInTheDocument();
	});

	// 3. Status badge
	it("shows correct status badge", () => {
		render(
			<AppealPanel appeal={mockAppeal} onClose={onClose} fetchAppeals={fetchAppeals} />
		);

		expect(screen.getByText("PENDING")).toBeInTheDocument();
	});

	// 4. Message fallback
	it("shows fallback message when no message provided", () => {
		const noMessageAppeal = { ...mockAppeal, message: null };

		render(
			<AppealPanel appeal={noMessageAppeal} onClose={onClose} fetchAppeals={fetchAppeals} />
		);

		expect(screen.getByText("No message provided")).toBeInTheDocument();
	});

	// 5. Buttons show only when pending
	it("shows action buttons when status is PENDING", () => {
		render(
			<AppealPanel appeal={mockAppeal} onClose={onClose} fetchAppeals={fetchAppeals} />
		);

		expect(screen.getByText(/Approve Appeal/i)).toBeInTheDocument();
		expect(screen.getByText(/Reject Appeal/i)).toBeInTheDocument();
	});

	// 6. Buttons hidden when not pending
	it("hides action buttons when not PENDING", () => {
		const approvedAppeal = { ...mockAppeal, status: "APPROVED" };

		render(
			<AppealPanel appeal={approvedAppeal} onClose={onClose} fetchAppeals={fetchAppeals} />
		);

		expect(screen.queryByText(/Approve Appeal/i)).toBeNull();
		expect(screen.queryByText(/Reject Appeal/i)).toBeNull();
	});

	// 7. Approve action
	it("calls API and callbacks on approve", async () => {
		mockFetch.mockResolvedValueOnce({ ok: true });

		render(
			<AppealPanel appeal={mockAppeal} onClose={onClose} fetchAppeals={fetchAppeals} />
		);

		fireEvent.click(screen.getByText(/Approve Appeal/i));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				`/api/admin/appeals/${mockAppeal.id}`,
				expect.objectContaining({
					method: "PATCH",
				})
			);
		});

		expect(fetchAppeals).toHaveBeenCalled();
		expect(onClose).toHaveBeenCalled();
	});

	// 8. Reject action
	it("calls API and callbacks on reject", async () => {
		mockFetch.mockResolvedValueOnce({ ok: true });

		render(
			<AppealPanel appeal={mockAppeal} onClose={onClose} fetchAppeals={fetchAppeals} />
		);

		fireEvent.click(screen.getByText(/Reject Appeal/i));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalled();
		});

		expect(fetchAppeals).toHaveBeenCalled();
		expect(onClose).toHaveBeenCalled();
	});

	// 9. Loading disables buttons
	it("disables buttons while loading", async () => {
		let resolvePromise;
		mockFetch.mockReturnValue(
			new Promise((resolve) => {
				resolvePromise = resolve;
			})
		);

		render(
			<AppealPanel appeal={mockAppeal} onClose={onClose} fetchAppeals={fetchAppeals} />
		);

		const approveBtn = screen.getByText(/Approve Appeal/i);
		fireEvent.click(approveBtn);

		expect(approveBtn).toBeDisabled();

		resolvePromise({ ok: true });

		await waitFor(() => {
			expect(approveBtn).not.toBeDisabled();
		});
	});

	// 10. Clicking overlay closes panel
	it("closes when clicking outside panel", () => {
		const { container } = render(
			<AppealPanel appeal={mockAppeal} onClose={onClose} fetchAppeals={fetchAppeals} />
		);

		fireEvent.click(container.firstChild);
		expect(onClose).toHaveBeenCalled();
	});

	// 11. Clicking inside panel does NOT close
	it("does not close when clicking inside panel", () => {
		render(
			<AppealPanel appeal={mockAppeal} onClose={onClose} fetchAppeals={fetchAppeals} />
		);

		fireEvent.click(screen.getByText("Appeal Details"));
		expect(onClose).not.toHaveBeenCalled();
	});
});