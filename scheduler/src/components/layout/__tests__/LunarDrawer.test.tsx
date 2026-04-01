import { render, screen, fireEvent } from "@testing-library/react";
import LunarDrawer from "../LunarDrawer";

/**
 * Tests the LunarDrawer component's rendering, positioning logic, and interaction behavior.
 */
describe("LunarDrawer", () => {
	const defaultProps = {
		open: true,
		onClose: jest.fn(),
		title: "Test Drawer",
		children: <div>Drawer Content</div>,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("returns null when closed", () => {
		const { container } = render(
			<LunarDrawer {...defaultProps} open={false} />
		);

		expect(container.firstChild).toBeNull();
	});

	test("renders title and children", () => {
		render(<LunarDrawer {...defaultProps} />);

		expect(
			screen.getByRole("heading", { name: "Test Drawer" })
		).toBeInTheDocument();

		expect(screen.getByText("Drawer Content")).toBeInTheDocument();
	});

	test("clicking overlay calls onClose", () => {
		render(<LunarDrawer {...defaultProps} />);

		// overlay = outer div (first element)
		const overlay = screen.getByRole("heading", {
			name: "Test Drawer",
		}).closest("div")!.parentElement!.parentElement!;

		fireEvent.click(overlay);

		expect(defaultProps.onClose).toHaveBeenCalled();
	});

	test("clicking inside drawer does NOT close", () => {
		render(<LunarDrawer {...defaultProps} />);

		const content = screen.getByText("Drawer Content");

		fireEvent.click(content);

		expect(defaultProps.onClose).not.toHaveBeenCalled();
	});

	test("close button calls onClose", () => {
		render(<LunarDrawer {...defaultProps} />);

		fireEvent.click(
			screen.getByRole("button", { name: "✕" })
		);

		expect(defaultProps.onClose).toHaveBeenCalled();
	});

	test("renders right side drawer", () => {
		const { container } = render(
			<LunarDrawer {...defaultProps} side="right" />
		);

		expect(container.firstChild).toHaveClass("justify-end");
	});

	test("renders left side drawer (default)", () => {
		const { container } = render(
			<LunarDrawer {...defaultProps} side="left" />
		);

		expect(container.firstChild).toHaveClass("justify-start");
	});

	test("renders bottom drawer with handle", () => {
		render(
			<LunarDrawer {...defaultProps} side="bottom" />
		);

		// Bottom handle exists
		expect(
			document.querySelector(".w-10.h-1")
		).toBeInTheDocument();
	});

	test("bottom drawer uses full width", () => {
		const { container } = render(
			<LunarDrawer {...defaultProps} side="bottom" />
		);

		expect(container.innerHTML).toContain("w-full");
	});

	test("custom width applied for side drawer", () => {
		const { container } = render(
			<LunarDrawer
				{...defaultProps}
				width="w-[500px]"
			/>
		);

		expect(container.innerHTML).toContain("w-[500px]");
	});
});