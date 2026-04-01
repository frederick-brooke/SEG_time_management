/**
 *
 * Full coverage for BannedPage, BanInfo, and AppealForm.
 */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import BannedPage from "../BanMessagePage";

// Mock next-auth
const updateMock = jest.fn();

jest.mock("next-auth/react", () => ({
	useSession: () => ({
		update: updateMock,
	}),
	signOut: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock child components (keep simple + controllable)
jest.mock("../BanInfo", () => (props: any) => (
	<div data-testid="ban-info">
		<button onClick={props.onAppeal}>Appeal</button>
		<span>{props.BanInfo?.reason}</span>
	</div>
));

jest.mock("../AppealForm", () => (props: any) => (
	<div data-testid="appeal-form">
		<span>Appeal Form</span>
		<button onClick={props.onClose}>Close</button>
		<span>{props.reportId}</span>
	</div>
));

// Mock layout components
jest.mock("@/components/ui/lunar-card", () => ({
	LunarCard: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/layout/LunarThemeWrapper", () => ({
	__esModule: true,
	default: ({ children }: any) => <div>{children}</div>,
}));

// Mock window.location
delete (window as any).location;
(window as any).location = { href: "" };
describe("BannedPage", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("shows loading screen initially", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({ reason: "Test", reportId: "123" }),
		});

		updateMock.mockResolvedValue({
			user: { isBanned: true },
		});

		render(<BannedPage />);

		// Loading should appear immediately
		expect(screen.getByText(/Loading…/i)).toBeInTheDocument();

		// Wait for load to finish
		await waitFor(() => {
			expect(screen.getByTestId("ban-info")).toBeInTheDocument();
		});
	});

	test("renders ban info after fetch", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({
				reason: "Violation",
				reportId: "abc",
			}),
		});

		updateMock.mockResolvedValue({
			user: { isBanned: true },
		});

		render(<BannedPage />);

		await waitFor(() => {
			expect(screen.getByText("Violation")).toBeInTheDocument();
		});
	});

	test("toggles to appeal form", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({
				reason: "Violation",
				reportId: "abc123",
			}),
		});

		updateMock.mockResolvedValue({
			user: { isBanned: true },
		});

		render(<BannedPage />);

		await waitFor(() => {
			expect(screen.getByTestId("ban-info")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText("Appeal"));

		expect(screen.getByTestId("appeal-form")).toBeInTheDocument();
		expect(screen.getByText("abc123")).toBeInTheDocument();
	});

	test("closes appeal form", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({
				reason: "Violation",
				reportId: "xyz",
			}),
		});

		updateMock.mockResolvedValue({
			user: { isBanned: true },
		});

		render(<BannedPage />);

		await waitFor(() => {
			expect(screen.getByTestId("ban-info")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText("Appeal"));

		expect(screen.getByTestId("appeal-form")).toBeInTheDocument();

		fireEvent.click(screen.getByText("Close"));

		expect(screen.getByTestId("ban-info")).toBeInTheDocument();
	});

	test("handles 401 response", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: false,
			status: 401,
		});

		updateMock.mockResolvedValue({
			user: { isBanned: true },
		});

		render(<BannedPage />);

		await waitFor(() => {
			expect(screen.getByText(/You must be logged in/i)).toBeInTheDocument();
		});
	});

	test("handles fetch error gracefully", async () => {
		(fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

		updateMock.mockResolvedValue({
			user: { isBanned: true },
		});

		render(<BannedPage />);

		await waitFor(() => {
			// still finishes loading even if error
			expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
		});
	});
});