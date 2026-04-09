/**
 * Testing for Dialog components.
 */

import { render, screen } from "@testing-library/react";
import {
	Dialog,
	DialogTrigger,
	DialogPortal,
	DialogClose,
	DialogOverlay,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
} from "../Dialog";

jest.mock("@radix-ui/react-dialog", () => ({
	Root: ({ children, ...props }: any) => (
		<div data-testid="dialog-root" {...props}>
			{children}
		</div>
	),
	Trigger: ({ children, ...props }: any) => (
		<button data-testid="dialog-trigger" {...props}>
			{children}
		</button>
	),
	Portal: ({ children, ...props }: any) => (
		<div data-testid="dialog-portal" {...props}>
			{children}
		</div>
	),
	Close: ({ children, asChild, ...props }: any) =>
		asChild ? (
			<div data-testid="dialog-close-aschild" {...props}>
				{children}
			</div>
		) : (
			<button data-testid="dialog-close" {...props}>
				{children}
			</button>
		),
	Overlay: ({ ...props }: any) => (
		<div data-testid="dialog-overlay" {...props} />
	),
	Content: ({ children, ...props }: any) => (
		<div data-testid="dialog-content" {...props}>
			{children}
		</div>
	),
	Title: ({ children, ...props }: any) => (
		<div data-testid="dialog-title" {...props}>
			{children}
		</div>
	),
	Description: ({ children, ...props }: any) => (
		<div data-testid="dialog-description" {...props}>
			{children}
		</div>
	),
}));

jest.mock("lucide-react", () => ({
	XIcon: (props: any) => <svg data-testid="x-icon" {...props} />,
}));

jest.mock("../Button", () => ({
	Button: ({ children, ...props }: any) => (
		<button {...props}>{children}</button>
	),
}));

describe("Dialog Components", () => {
	it("renders Dialog root", () => {
		render(<Dialog>Content</Dialog>);
		expect(screen.getByTestId("dialog-root")).toBeInTheDocument();
	});

	it("renders DialogTrigger", () => {
		render(<DialogTrigger>Open</DialogTrigger>);
		expect(screen.getByTestId("dialog-trigger")).toBeInTheDocument();
	});

	it("renders DialogPortal", () => {
		render(<DialogPortal>Portal</DialogPortal>);
		expect(screen.getByTestId("dialog-portal")).toBeInTheDocument();
	});

	it("renders DialogClose", () => {
		render(<DialogClose>Close</DialogClose>);
		expect(screen.getByTestId("dialog-close")).toBeInTheDocument();
	});

	it("renders DialogOverlay with custom class", () => {
		render(<DialogOverlay className="test-class" />);
		const overlay = screen.getByTestId("dialog-overlay");
		expect(overlay).toBeInTheDocument();
		expect(overlay.className).toContain("test-class");
	});

	it("renders DialogContent with close button by default", () => {
		render(<DialogContent>Dialog Body</DialogContent>);

		expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
		expect(screen.getByText("Dialog Body")).toBeInTheDocument();
		expect(screen.getByTestId("dialog-overlay")).toBeInTheDocument();
		expect(screen.getByTestId("dialog-close")).toBeInTheDocument();
		expect(screen.getByTestId("x-icon")).toBeInTheDocument();
		expect(screen.getByText("Close")).toBeInTheDocument();
	});

	it("renders DialogContent without close button when showCloseButton is false", () => {
		render(
			<DialogContent showCloseButton={false}>Dialog Body</DialogContent>,
		);

		expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
		expect(screen.queryByTestId("dialog-close")).not.toBeInTheDocument();
	});

	it("renders DialogHeader", () => {
		render(<DialogHeader>Header</DialogHeader>);
		expect(screen.getByText("Header")).toBeInTheDocument();
	});

	it("renders DialogFooter without close button by default", () => {
		render(<DialogFooter>Footer</DialogFooter>);
		expect(screen.getByText("Footer")).toBeInTheDocument();
		expect(
			screen.queryByTestId("dialog-close-aschild"),
		).not.toBeInTheDocument();
	});

	it("renders DialogFooter with close button when showCloseButton is true", () => {
		render(<DialogFooter showCloseButton={true}>Footer</DialogFooter>);
		expect(screen.getByText("Footer")).toBeInTheDocument();
		expect(screen.getByTestId("dialog-close-aschild")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Close" }),
		).toBeInTheDocument();
	});

	it("renders DialogTitle", () => {
		render(<DialogTitle>Title</DialogTitle>);
		expect(screen.getByTestId("dialog-title")).toBeInTheDocument();
		expect(screen.getByText("Title")).toBeInTheDocument();
	});

	it("renders DialogDescription", () => {
		render(<DialogDescription>Description</DialogDescription>);
		expect(screen.getByTestId("dialog-description")).toBeInTheDocument();
		expect(screen.getByText("Description")).toBeInTheDocument();
	});
});
