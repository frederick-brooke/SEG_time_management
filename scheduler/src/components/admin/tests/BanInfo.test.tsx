import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BanInfo from "../banInfo";

// Mock lucide icons
jest.mock("lucide-react", () => ({
	AlertTriangle: () => <div data-testid="icon-alert" />,
	ShieldOff: () => <div data-testid="icon-shield" />,
	X: () => <div />,
}));

// Mock next-auth signOut
const signOutMock = jest.fn();

jest.mock("next-auth/react", () => ({
	signOut: (...args: any[]) => signOutMock(...args),
}));

describe("BanInfo", () => {
	const baseProps = {
		onAppeal: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("renders basic ban info", () => {
		render(
			<BanInfo
				{...baseProps}
				banInfo={{ reason: "Violation", expires: null }}
			/>
		);

		expect(screen.getByText("Account Banned")).toBeInTheDocument();
		expect(screen.getByText("Violation")).toBeInTheDocument();
	});

	test("shows permanent ban", () => {
		render(
			<BanInfo
				{...baseProps}
				banInfo={{ reason: "Serious abuse", expires: null }}
			/>
		);

		expect(screen.getByText("Permanent")).toBeInTheDocument();
	});

	test("shows temporary ban with formatted date", () => {
		const date = new Date("2026-01-01T10:00:00Z");

		render(
			<BanInfo
				{...baseProps}
				banInfo={{
					reason: "Spam",
					expires: date.toISOString(),
				}}
			/>
		);

		expect(screen.getByText("Spam")).toBeInTheDocument();

		// Match partial since locale formatting varies
		expect(
			screen.getByText((text) =>
				text.includes(new Date(date).getFullYear().toString())
			)
		).toBeInTheDocument();
	});

	test("renders warning note", () => {
		render(
			<BanInfo
				{...baseProps}
				banInfo={{ reason: "Test", expires: null }}
			/>
		);

		expect(
			screen.getByText(/you believe this ban was issued in error/i)
		).toBeInTheDocument();
	});

	test("clicking appeal calls onAppeal", () => {
		render(
			<BanInfo
				{...baseProps}
				banInfo={{ reason: "Test", expires: null }}
			/>
		);

		fireEvent.click(screen.getByText("Submit Appeal"));

		expect(baseProps.onAppeal).toHaveBeenCalled();
	});

	test("clicking sign out calls signOut with callbackUrl", () => {
		render(
			<BanInfo
				{...baseProps}
				banInfo={{ reason: "Test", expires: null }}
			/>
		);

		fireEvent.click(screen.getByText("Sign Out"));

		expect(signOutMock).toHaveBeenCalledWith({
			callbackUrl: "/login",
		});
	});
});