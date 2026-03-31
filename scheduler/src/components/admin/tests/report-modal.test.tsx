import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportModal from "../report-modal";

// Mock createPortal (render inline instead of real portal)
jest.mock("react-dom", () => ({
	...jest.requireActual("react-dom"),
	createPortal: (node: any) => node,
}));

// Mock UI components
jest.mock("@/components/ui/lunar-card", () => ({
	LunarCard: ({ children }: any) => <div>{children}</div>,
}));

// Mock lucide icons
jest.mock("lucide-react", () => ({
	AlertTriangle: () => <div data-testid="icon-alert" />,
	X: () => <div data-testid="icon-x" />,
}));

// Mock alert + fetch
global.alert = jest.fn();
global.fetch = jest.fn();

describe("ReportModal", () => {
	const defaultProps = {
		reportedUserId: "user123",
		reportedUsername: "testuser",
		onClose: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("renders modal with username", () => {
		render(<ReportModal {...defaultProps} />);

		expect(screen.getByText("Report User")).toBeInTheDocument();
		expect(screen.getByText(/@testuser/)).toBeInTheDocument();
	});

	test("renders without username", () => {
		render(<ReportModal {...defaultProps} reportedUsername="" />);

		expect(screen.queryByText(/@/)).not.toBeInTheDocument();
	});

	test("updates reason and description", () => {
		render(<ReportModal {...defaultProps} />);

		const select = screen.getByRole("combobox");
		const textarea = screen.getByRole("textbox");

		fireEvent.change(select, { target: { value: "SPAM" } });
		fireEvent.change(textarea, { target: { value: "Details" } });

		expect(select).toHaveValue("SPAM");
		expect(textarea).toHaveValue("Details");
	});

	test("submit button disabled when no reason", () => {
		render(<ReportModal {...defaultProps} />);

		const submitBtn = screen.getByText("Submit Report");
		expect(submitBtn).toBeDisabled();
	});

	test("successful submission", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({}),
		});

		render(<ReportModal {...defaultProps} />);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "SPAM" },
		});

		fireEvent.click(screen.getByText("Submit Report"));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalled();
		});

		expect(global.alert).toHaveBeenCalledWith(
			"Report submitted successfully."
		);

		expect(defaultProps.onClose).toHaveBeenCalled();
	});

	test("API error response", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: false,
			json: async () => ({ error: "Bad request" }),
		});

		render(<ReportModal {...defaultProps} />);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "SPAM" },
		});

		fireEvent.click(screen.getByText("Submit Report"));

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith("Bad request");
		});

		expect(defaultProps.onClose).not.toHaveBeenCalled();
	});

	test("API error fallback message", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: false,
			json: async () => ({}),
		});

		render(<ReportModal {...defaultProps} />);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "SPAM" },
		});

		fireEvent.click(screen.getByText("Submit Report"));

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith(
				"Something went wrong."
			);
		});
	});

	test("network error handling", async () => {
		(fetch as jest.Mock).mockRejectedValue(new Error("fail"));

		render(<ReportModal {...defaultProps} />);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "SPAM" },
		});

		fireEvent.click(screen.getByText("Submit Report"));

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith(
				"Failed to submit report"
			);
		});
	});

	test("loading state disables button and shows text", async () => {
		let resolvePromise: any;

		(fetch as jest.Mock).mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvePromise = resolve;
				})
		);

		render(<ReportModal {...defaultProps} />);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "SPAM" },
		});

		fireEvent.click(screen.getByText("Submit Report"));

		expect(screen.getByText("Submitting…")).toBeInTheDocument();

		resolvePromise({
			ok: true,
			json: async () => ({}),
		});

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalled();
		});
	});

	test("cancel button calls onClose", () => {
		render(<ReportModal {...defaultProps} />);

		fireEvent.click(screen.getByText("Cancel"));

		expect(defaultProps.onClose).toHaveBeenCalled();
	});

	test("close icon calls onClose", () => {
		render(<ReportModal {...defaultProps} />);

		const buttons = screen.getAllByRole("button");
		fireEvent.click(buttons[0]); // top-right X button

		expect(defaultProps.onClose).toHaveBeenCalled();
	});
});