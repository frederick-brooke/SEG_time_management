import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AppealForm from "../appealForm";

jest.mock("lucide-react", () => ({
	X: () => <div data-testid="icon-x" />,
	AlertTriangle: () => <div />,
	ShieldOff: () => <div />,
}));

global.fetch = jest.fn();
global.alert = jest.fn();

describe("AppealForm", () => {
	const defaultProps = {
		reportId: "report123",
		onClose: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("renders form correctly", () => {
		render(<AppealForm {...defaultProps} />);

		expect(
			screen.getByRole("heading", { name: "Submit Appeal" })
		).toBeInTheDocument();

		expect(screen.getByRole("textbox")).toBeInTheDocument();

		expect(
			screen.getByRole("button", { name: "Cancel" })
		).toBeInTheDocument();
	});

	test("updates textarea value", () => {
		render(<AppealForm {...defaultProps} />);

		const textarea = screen.getByRole("textbox");

		fireEvent.change(textarea, {
			target: { value: "My appeal reason" },
		});

		expect(textarea).toHaveValue("My appeal reason");
	});

	test("submit button disabled when empty", () => {
		render(<AppealForm {...defaultProps} />);

		const submitBtn = screen.getByRole("button", {
			name: "Submit Appeal",
		});

		expect(submitBtn).toBeDisabled();
	});

	test("successful submission", async () => {
		(fetch as jest.Mock).mockResolvedValue({ ok: true });

		render(<AppealForm {...defaultProps} />);

		fireEvent.change(screen.getByRole("textbox"), {
			target: { value: "Appeal text" },
		});

		fireEvent.click(
			screen.getByRole("button", { name: "Submit Appeal" })
		);

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				"/api/appeal",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						description: "Appeal text",
						reportId: "report123",
					}),
				})
			);
		});

		expect(global.alert).toHaveBeenCalledWith("Appeal submitted.");
		expect(defaultProps.onClose).toHaveBeenCalled();
	});

	test("handles fetch error", async () => {
		(fetch as jest.Mock).mockRejectedValue(new Error("fail"));

		render(<AppealForm {...defaultProps} />);

		fireEvent.change(screen.getByRole("textbox"), {
			target: { value: "Appeal text" },
		});

		fireEvent.click(
			screen.getByRole("button", { name: "Submit Appeal" })
		);

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith(
				"Failed to submit appeal"
			);
		});

		expect(defaultProps.onClose).not.toHaveBeenCalled();
	});

	test("loading state disables button and shows text", async () => {
		let resolvePromise: any;

		(fetch as jest.Mock).mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvePromise = resolve;
				})
		);

		render(<AppealForm {...defaultProps} />);

		fireEvent.change(screen.getByRole("textbox"), {
			target: { value: "Appeal text" },
		});

		const submitBtn = screen.getByRole("button", {
			name: "Submit Appeal",
		});

		fireEvent.click(submitBtn);

		// Button switches to loading state
		expect(
			screen.getByRole("button", { name: "Submitting…" })
		).toBeDisabled();

		resolvePromise({ ok: true });

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalled();
		});
	});

	test("cancel button calls onClose", () => {
		render(<AppealForm {...defaultProps} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Cancel" })
		);

		expect(defaultProps.onClose).toHaveBeenCalled();
	});

	test("close icon calls onClose", () => {
		render(<AppealForm {...defaultProps} />);

		const buttons = screen.getAllByRole("button");
		fireEvent.click(buttons[0]); // top-right X

		expect(defaultProps.onClose).toHaveBeenCalled();
	});
});