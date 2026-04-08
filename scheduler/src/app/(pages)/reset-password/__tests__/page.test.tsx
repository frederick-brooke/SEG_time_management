import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ResetPasswordContent, FormInput } from "../page";

// Mocks

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: jest.fn(),
}));

jest.mock("@/lib/password", () => ({
	validatePassword: jest.fn(),
}));

import { useSearchParams } from "next/navigation";
import { validatePassword } from "@/lib/password";

const mockUseSearchParams = useSearchParams as jest.Mock;
const mockValidatePassword = validatePassword as jest.Mock;

// Helper to set the ?token= query param
function setToken(token: string | null) {
	mockUseSearchParams.mockReturnValue({
		get: (key: string) => (key === "token" ? token : null),
	});
}

// Helper to render and return userEvent instance
function setup() {
	const user = userEvent.setup();
	render(<ResetPasswordContent />);
	return user;
}

// Tests

beforeEach(() => {
	jest.clearAllMocks();
	mockValidatePassword.mockReturnValue(null); // valid password by default
	global.fetch = jest.fn();
});

describe("ResetPasswordContent — no token", () => {
	it("renders the invalid token message when token is missing", () => {
		setToken(null);
		render(<ResetPasswordContent />);
		expect(
			screen.getByText("Invalid or missing token."),
		).toBeInTheDocument();
	});

	it("does not render the form when token is missing", () => {
		setToken(null);
		render(<ResetPasswordContent />);
		expect(screen.queryByRole("form")).not.toBeInTheDocument();
		expect(
			screen.queryByLabelText(/new password/i),
		).not.toBeInTheDocument();
	});
});

describe("ResetPasswordContent — with token", () => {
	beforeEach(() => setToken("valid-token-abc"));

	it("renders the form with both password fields and submit button", () => {
		setup();
		expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /save password/i }),
		).toBeInTheDocument();
	});

	it("does not show any message on initial render", () => {
		setup();
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	it("shows an error when passwords do not match", async () => {
		const user = setup();
		await user.type(screen.getByLabelText(/new password/i), "Password1!");
		await user.type(
			screen.getByLabelText(/confirm password/i),
			"Different1!",
		);
		await user.click(
			screen.getByRole("button", { name: /save password/i }),
		);
		expect(
			await screen.findByText("Passwords do not match."),
		).toBeInTheDocument();
		expect(fetch).not.toHaveBeenCalled();
	});

	it("shows an error from validatePassword when password is invalid", async () => {
		mockValidatePassword.mockReturnValue(
			"Password must be at least 8 characters.",
		);
		const user = setup();
		await user.type(screen.getByLabelText(/new password/i), "short");
		await user.type(screen.getByLabelText(/confirm password/i), "short");
		await user.click(
			screen.getByRole("button", { name: /save password/i }),
		);
		expect(
			await screen.findByText("Password must be at least 8 characters."),
		).toBeInTheDocument();
		expect(fetch).not.toHaveBeenCalled();
	});

	it("shows 'Saving...' on the button while the request is in flight", async () => {
		// Delay fetch resolution so we can observe the loading state
		(fetch as jest.Mock).mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(
						() => resolve({ ok: true, json: async () => ({}) }),
						500,
					),
				),
		);
		const user = setup();
		await user.type(screen.getByLabelText(/new password/i), "ValidPass1!");
		await user.type(
			screen.getByLabelText(/confirm password/i),
			"ValidPass1!",
		);
		await user.click(
			screen.getByRole("button", { name: /save password/i }),
		);
		expect(
			await screen.findByRole("button", { name: /saving/i }),
		).toBeInTheDocument();
	});

	it("calls fetch with the correct payload on valid submission", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({}),
		});
		const user = setup();
		await user.type(screen.getByLabelText(/new password/i), "ValidPass1!");
		await user.type(
			screen.getByLabelText(/confirm password/i),
			"ValidPass1!",
		);
		await user.click(
			screen.getByRole("button", { name: /save password/i }),
		);

		await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
		expect(fetch).toHaveBeenCalledWith("/api/auth/reset-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				token: "valid-token-abc",
				password: "ValidPass1!",
			}),
		});
	});

	it("shows success message after a successful reset", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({}),
		});
		const user = setup();
		await user.type(screen.getByLabelText(/new password/i), "ValidPass1!");
		await user.type(
			screen.getByLabelText(/confirm password/i),
			"ValidPass1!",
		);
		await user.click(
			screen.getByRole("button", { name: /save password/i }),
		);
		expect(
			await screen.findByText("Password reset successful."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /save password/i }),
		).toBeInTheDocument();
	});

	it("shows the server error message when the API returns a non-ok response", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: false,
			json: async () => ({ error: "Token has expired." }),
		});
		const user = setup();
		await user.type(screen.getByLabelText(/new password/i), "ValidPass1!");
		await user.type(
			screen.getByLabelText(/confirm password/i),
			"ValidPass1!",
		);
		await user.click(
			screen.getByRole("button", { name: /save password/i }),
		);
		expect(
			await screen.findByText("Token has expired."),
		).toBeInTheDocument();
	});

	it("falls back to a generic error when API returns no error field", async () => {
		(fetch as jest.Mock).mockResolvedValue({
			ok: false,
			json: async () => ({}),
		});
		const user = setup();
		await user.type(screen.getByLabelText(/new password/i), "ValidPass1!");
		await user.type(
			screen.getByLabelText(/confirm password/i),
			"ValidPass1!",
		);
		await user.click(
			screen.getByRole("button", { name: /save password/i }),
		);
		expect(
			await screen.findByText("Unable to reset password."),
		).toBeInTheDocument();
	});

	it("shows a generic error when fetch throws a network error", async () => {
		(fetch as jest.Mock).mockRejectedValue(new Error("Network failure"));
		const user = setup();
		await user.type(screen.getByLabelText(/new password/i), "ValidPass1!");
		await user.type(
			screen.getByLabelText(/confirm password/i),
			"ValidPass1!",
		);
		await user.click(
			screen.getByRole("button", { name: /save password/i }),
		);
		expect(
			await screen.findByText("Something went wrong."),
		).toBeInTheDocument();
	});

	it("clears any previous error message on a new submission attempt", async () => {
		const user = setup();

		// First submission — mismatched passwords
		await user.type(screen.getByLabelText(/new password/i), "ValidPass1!");
		await user.type(screen.getByLabelText(/confirm password/i), "Wrong1!");
		await user.click(
			screen.getByRole("button", { name: /save password/i }),
		);
		expect(
			await screen.findByText("Passwords do not match."),
		).toBeInTheDocument();

		// Fix passwords and resubmit
		(fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({}),
		});
		await user.clear(screen.getByLabelText(/confirm password/i));
		await user.type(
			screen.getByLabelText(/confirm password/i),
			"ValidPass1!",
		);
		await user.click(
			screen.getByRole("button", { name: /save password/i }),
		);

		await waitFor(() => {
			expect(
				screen.queryByText("Passwords do not match."),
			).not.toBeInTheDocument();
		});
		expect(
			await screen.findByText("Password reset successful."),
		).toBeInTheDocument();
	});
});

describe("ResetPasswordPage — Suspense wrapper", () => {
	it("renders the Suspense fallback then resolves", async () => {
		setToken("valid-token-abc");
		const { default: ResetPasswordPage } = await import("../page");
		render(<ResetPasswordPage />);
		// After Suspense resolves the form should be present
		expect(
			await screen.findByLabelText(/new password/i),
		).toBeInTheDocument();
	});

	it("FormInput defaults to text type when no type prop is provided", () => {
		render(
			<FormInput
				label="Username"
				name="username"
				value="abc"
				onChange={() => {}}
			/>,
		);

		expect(screen.getByLabelText(/username/i)).toHaveAttribute(
			"type",
			"text",
		);
	});
});
