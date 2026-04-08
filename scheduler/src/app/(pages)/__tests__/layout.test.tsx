/**
 * Testing for app/(pages)/layout.tsx
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PagesLayout from "../layout";

const mockUseSession = jest.fn();

jest.mock("next-auth/react", () => ({
	useSession: () => mockUseSession(),
}));

jest.mock("@/components/layout/AppSidebar", () => ({
	AppSidebar: ({ onSearchClick }: any) => (
		<button onClick={onSearchClick}>open-sidebar-search</button>
	),
}));

jest.mock("@/components/search-page/SearchPanel", () => ({
	__esModule: true,
	default: ({ onClose, open }: any) => (
		<div>
			<span>{String(open)}</span>
			<button onClick={onClose}>close-search</button>
		</div>
	),
}));

jest.mock("@/components/ui/Sidebar", () => ({
	SidebarProvider: ({ children, open, className, style }: any) => (
		<div
			data-testid="sidebar-provider"
			data-open={String(open)}
			className={className}
			style={style}
		>
			{children}
		</div>
	),
	SidebarInset: ({ children, className, style }: any) => (
		<div data-testid="sidebar-inset" className={className} style={style}>
			{children}
		</div>
	),
	SidebarTrigger: ({ onClick, className }: any) => (
		<button className={className} onClick={onClick}>
			toggle-sidebar
		</button>
	),
}));

describe("PagesLayout", () => {
	const renderLayout = () =>
		render(
			<PagesLayout>
				<div>page-content</div>
			</PagesLayout>,
		);

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseSession.mockReturnValue({
			data: { user: { id: "user-123", name: "Test User" } },
			status: "authenticated",
		});
	});

	it("renders children", () => {
		renderLayout();
		expect(screen.getByText("page-content")).toBeInTheDocument();
	});

	it("returns null while session is loading", () => {
		mockUseSession.mockReturnValue({
			data: null,
			status: "loading",
		});

		const { container } = renderLayout();
		expect(container.firstChild).toBeNull();
	});

	it("renders only children when there is no session", () => {
		mockUseSession.mockReturnValue({
			data: null,
			status: "unauthenticated",
		});

		renderLayout();

		expect(screen.getByText("page-content")).toBeInTheDocument();
		expect(
			screen.queryByText("open-sidebar-search"),
		).not.toBeInTheDocument();
		expect(screen.queryByText("toggle-sidebar")).not.toBeInTheDocument();
	});

	it("renders sidebar layout when authenticated", () => {
		renderLayout();

		expect(screen.getByTestId("sidebar-provider")).toBeInTheDocument();
		expect(screen.getByTestId("sidebar-inset")).toBeInTheDocument();
		expect(screen.getByText("open-sidebar-search")).toBeInTheDocument();
		expect(screen.getByText("toggle-sidebar")).toBeInTheDocument();
	});

	it("opens search panel", () => {
		renderLayout();

		fireEvent.click(screen.getByText("open-sidebar-search"));

		expect(screen.getByText("close-search")).toBeInTheDocument();
		expect(
			screen.queryByText("open-sidebar-search"),
		).not.toBeInTheDocument();
	});

	it("closes search panel", () => {
		renderLayout();

		fireEvent.click(screen.getByText("open-sidebar-search"));
		fireEvent.click(screen.getByText("close-search"));

		expect(screen.getByText("open-sidebar-search")).toBeInTheDocument();
		expect(screen.queryByText("close-search")).not.toBeInTheDocument();
	});

	it("toggles sidebar", () => {
		renderLayout();

		expect(screen.getByTestId("sidebar-provider")).toHaveAttribute(
			"data-open",
			"true",
		);

		fireEvent.click(screen.getByText("toggle-sidebar"));
		expect(screen.getByTestId("sidebar-provider")).toHaveAttribute(
			"data-open",
			"false",
		);

		fireEvent.click(screen.getByText("toggle-sidebar"));
		expect(screen.getByTestId("sidebar-provider")).toHaveAttribute(
			"data-open",
			"true",
		);
	});

	it("renders modal root", () => {
		renderLayout();
		expect(document.getElementById("modal-root")).toBeInTheDocument();
	});

	it("applies sidebar provider styles", () => {
		renderLayout();

		const provider = screen.getByTestId("sidebar-provider");
		expect(provider).toHaveStyle(
			"--sidebar-width: calc(var(--spacing) * 72)",
		);
		expect(provider).toHaveStyle(
			"--header-height: calc(var(--spacing) * 12)",
		);
		expect(provider).toHaveStyle("background: #070b18");
	});

	it("updates inset width when sidebar is collapsed", () => {
		renderLayout();

		const inset = screen.getByTestId("sidebar-inset");
		expect(inset.style.width).toBe("");

		fireEvent.click(screen.getByText("toggle-sidebar"));
		expect(inset.style.width).toBe("100vw");
	});
});
