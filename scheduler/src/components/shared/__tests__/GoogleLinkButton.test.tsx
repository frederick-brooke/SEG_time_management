import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GoogleLinkButton from "../GoogleLinkButton";
import { signIn } from "next-auth/react";

jest.mock("next-auth/react", () => ({
	signIn: jest.fn(),
}));

jest.mock("../../ui/Button", () => ({
	Button: ({ children, onClick, className, ...props }: any) => (
		<button onClick={onClick} className={className} {...props}>
			{children}
		</button>
	),
}));

const mockedSignIn = signIn as jest.Mock;

describe("GoogleLinkButton", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders connected state message and reconnect button when isConnected is true", () => {
		render(<GoogleLinkButton isConnected={true} />);

		expect(screen.getByText("Google Calendar Connected")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Having sync issues\? Reconnect/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByText("Link Google Calendar"),
		).not.toBeInTheDocument();
	});

	it("calls signIn with google and callbackUrl when reconnect button is clicked", () => {
		render(<GoogleLinkButton isConnected={true} />);

		fireEvent.click(
			screen.getByRole("button", { name: /Having sync issues\? Reconnect/i }),
		);

		expect(mockedSignIn).toHaveBeenCalledTimes(1);
		expect(mockedSignIn).toHaveBeenCalledWith("google", {
			callbackUrl: "/calendar",
		});
	});

	it("renders link button with google icon when isConnected is false", () => {
		render(<GoogleLinkButton isConnected={false} />);

		expect(
			screen.getByRole("button", { name: /Link Google Calendar/i }),
		).toBeInTheDocument();
		expect(screen.getByAltText("Google")).toBeInTheDocument();
		expect(
			screen.queryByText("Google Calendar Connected"),
		).not.toBeInTheDocument();
	});

	it("calls signIn with google and callbackUrl when link button is clicked", () => {
		render(<GoogleLinkButton isConnected={false} />);

		fireEvent.click(
			screen.getByRole("button", { name: /Link Google Calendar/i }),
		);

		expect(mockedSignIn).toHaveBeenCalledTimes(1);
		expect(mockedSignIn).toHaveBeenCalledWith("google", {
			callbackUrl: "/calendar",
		});
	});
});