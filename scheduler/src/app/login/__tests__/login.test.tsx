import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../page";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

jest.mock("next-auth/react", () => ({
	signIn: jest.fn(),
	useSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
	useSearchParams: jest.fn(),
}));

jest.mock("next/link", () => {
	return ({ children, href }: any) => <a href={href}>{children}</a>;
});

const mockPush = jest.fn();
const mockReplace = jest.fn();

const mockedSignIn = signIn as jest.Mock;
const mockedUseSession = useSession as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;
const mockedUseSearchParams = useSearchParams as jest.Mock;

function makeSearchParams(error: string | null = null) {
	return {
		get: jest.fn((key: string) => (key === "error" ? error : null)),
	};
}

describe("LoginPage", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedUseRouter.mockReturnValue({
			push: mockPush,
			replace: mockReplace,
		});
		mockedUseSearchParams.mockReturnValue(makeSearchParams(null));
		mockedUseSession.mockReturnValue({ status: "unauthenticated" });
		global.fetch = jest.fn();
	});

	it("renders the login form", () => {
		render(<LoginPage />);

		expect(screen.getByText("Welcome Back")).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
		).toBeInTheDocument();
		expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /initiate launch/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
	});

	it("renders forgot password link correctly", () => {
		render(<LoginPage />);
		expect(screen.getByRole("link", { name: /forgot your password/i })).toHaveAttribute(
			"href",
			"/forgot-password",
		);
	});

	it("shows loading spinner when session status is loading", () => {
		mockedUseSession.mockReturnValue({ status: "loading" });

		const { container } = render(<LoginPage />);

		expect(screen.queryByText("Welcome Back")).not.toBeInTheDocument();
		expect(container.querySelector(".animate-spin")).toBeInTheDocument();
	});

	it("shows loading spinner when session status is authenticated before redirect", () => {
		mockedUseSession.mockReturnValue({ status: "authenticated" });

		const { container } = render(<LoginPage />);

		expect(container.querySelector(".animate-spin")).toBeInTheDocument();
	});

	it("redirects authenticated users to dashboard", async () => {
		mockedUseSession.mockReturnValue({ status: "authenticated" });

		render(<LoginPage />);

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith("/dashboard");
		});
	});

	it("redirects authenticated users with auth error in query params", async () => {
		mockedUseSession.mockReturnValue({ status: "authenticated" });
		mockedUseSearchParams.mockReturnValue(makeSearchParams("AccessDenied"));

		render(<LoginPage />);

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(
				"/dashboard?error=AccessDenied",
			);
		});
	});

	it("shows AccessDenied error from search params", async () => {
		mockedUseSearchParams.mockReturnValue(makeSearchParams("AccessDenied"));

		render(<LoginPage />);

		expect(
			await screen.findByText(
				"Access denied. Please check your credentials.",
			),
		).toBeInTheDocument();
	});

	it("updates identifier and password fields", () => {
		render(<LoginPage />);

		const identifierInput = screen.getByPlaceholderText(
			"e.g. jsmith or john@example.com",
		);
		const passwordInput = screen.getByPlaceholderText("••••••••");

		fireEvent.change(identifierInput, { target: { value: "deeti" } });
		fireEvent.change(passwordInput, { target: { value: "secret123" } });

		expect(identifierInput).toHaveValue("deeti");
		expect(passwordInput).toHaveValue("secret123");
	});

	it("submits credentials through signIn", async () => {
		mockedSignIn.mockResolvedValue({ error: "CredentialsSignin" });

		render(<LoginPage />);

		fireEvent.change(
			screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
			{
				target: { value: "deeti" },
			},
		);
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "secret123" },
		});

		fireEvent.submit(screen.getByRole("button", { name: /initiate launch/i }).closest("form")!);

		await waitFor(() => {
			expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
				redirect: false,
				identifier: "deeti",
				password: "secret123",
			});
		});
	});

	it("shows banned error when signIn returns Banned", async () => {
		mockedSignIn.mockResolvedValue({ error: "Banned" });

		render(<LoginPage />);

		fireEvent.change(
			screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
			{
				target: { value: "deeti" },
			},
		);
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "secret123" },
		});

		fireEvent.click(
			screen.getByRole("button", { name: /initiate launch/i }),
		);

		expect(
			await screen.findByText("Your account has been banned."),
		).toBeInTheDocument();
		expect(screen.getByRole("button")).toHaveTextContent("Initiate Launch");
	});

	it("shows invalid credentials error when signIn returns non-banned error", async () => {
		mockedSignIn.mockResolvedValue({ error: "CredentialsSignin" });

		render(<LoginPage />);

		fireEvent.change(
			screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
			{
				target: { value: "deeti" },
			},
		);
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "wrongpass" },
		});

		fireEvent.click(
			screen.getByRole("button", { name: /initiate launch/i }),
		);

		expect(
			await screen.findByText("Invalid email/username or password."),
		).toBeInTheDocument();
		expect(screen.getByRole("button")).toHaveTextContent("Initiate Launch");
	});

	it("clears existing error before a new submission", async () => {
		mockedUseSearchParams.mockReturnValue(makeSearchParams("AccessDenied"));
		mockedSignIn.mockResolvedValue({ error: "CredentialsSignin" });

		render(<LoginPage />);

		expect(
			await screen.findByText(
				"Access denied. Please check your credentials.",
			),
		).toBeInTheDocument();

		fireEvent.change(
			screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
			{
				target: { value: "deeti" },
			},
		);
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "wrongpass" },
		});

		fireEvent.click(
			screen.getByRole("button", { name: /initiate launch/i }),
		);

		expect(
			await screen.findByText("Invalid email/username or password."),
		).toBeInTheDocument();
		expect(
			screen.queryByText("Access denied. Please check your credentials."),
		).not.toBeInTheDocument();
	});

	it("routes to dashboard when login succeeds and preferences exist", async () => {
		mockedSignIn.mockResolvedValue({ error: null });
		(global.fetch as jest.Mock)
			.mockResolvedValueOnce({
				json: async () => ({ user: { id: "user-1" } }),
			})
			.mockResolvedValueOnce({
				json: async () => ({ hasPreferences: true }),
			});

		render(<LoginPage />);

		fireEvent.change(
			screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
			{
				target: { value: "deeti" },
			},
		);
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "secret123" },
		});

		fireEvent.click(
			screen.getByRole("button", { name: /initiate launch/i }),
		);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/auth/session");
			expect(global.fetch).toHaveBeenNthCalledWith(
				2,
				"/api/preferences/check?userId=user-1",
			);
			expect(mockPush).toHaveBeenCalledWith("/dashboard");
		});
	});

	it("routes to quiz when login succeeds and preferences do not exist", async () => {
		mockedSignIn.mockResolvedValue({ error: null });
		(global.fetch as jest.Mock)
			.mockResolvedValueOnce({
				json: async () => ({ user: { id: "user-2" } }),
			})
			.mockResolvedValueOnce({
				json: async () => ({ hasPreferences: false }),
			});

		render(<LoginPage />);

		fireEvent.change(
			screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
			{
				target: { value: "deeti" },
			},
		);
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "secret123" },
		});

		fireEvent.click(
			screen.getByRole("button", { name: /initiate launch/i }),
		);

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("/quiz");
		});
	});

	it("shows session error when session user id is missing after sign-in", async () => {
		mockedSignIn.mockResolvedValue({ error: null });
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			json: async () => ({ user: {} }),
		});

		render(<LoginPage />);

		fireEvent.change(
			screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
			{
				target: { value: "deeti" },
			},
		);
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "secret123" },
		});

		fireEvent.click(
			screen.getByRole("button", { name: /initiate launch/i }),
		);

		expect(
			await screen.findByText("Failed to get user session."),
		).toBeInTheDocument();
		expect(screen.getByRole("button")).toHaveTextContent("Initiate Launch");
	});

	it("shows unexpected error when session fetch throws", async () => {
		mockedSignIn.mockResolvedValue({ error: null });
		(global.fetch as jest.Mock).mockRejectedValue(new Error("network fail"));

		render(<LoginPage />);

		fireEvent.change(
			screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
			{
				target: { value: "deeti" },
			},
		);
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "secret123" },
		});

		fireEvent.click(
			screen.getByRole("button", { name: /initiate launch/i }),
		);

		expect(
			await screen.findByText(
				"An unexpected error occurred during login.",
			),
		).toBeInTheDocument();
		expect(screen.getByRole("button")).toHaveTextContent("Initiate Launch");
	});

	it("shows unexpected error when preferences fetch json rejects", async () => {
		mockedSignIn.mockResolvedValue({ error: null });
		(global.fetch as jest.Mock)
			.mockResolvedValueOnce({
				json: async () => ({ user: { id: "user-3" } }),
			})
			.mockResolvedValueOnce({
				json: async () => {
					throw new Error("bad prefs json");
				},
			});

		render(<LoginPage />);

		fireEvent.change(
			screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
			{
				target: { value: "deeti" },
			},
		);
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "secret123" },
		});

		fireEvent.click(
			screen.getByRole("button", { name: /initiate launch/i }),
		);

		expect(
			await screen.findByText(
				"An unexpected error occurred during login.",
			),
		).toBeInTheDocument();
	});

	it("shows authenticating state while login is pending", async () => {
		let resolveSignIn: (value: any) => void = () => {};
		mockedSignIn.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveSignIn = resolve;
				}),
		);

		render(<LoginPage />);

		fireEvent.change(
			screen.getByPlaceholderText("e.g. jsmith or john@example.com"),
			{
				target: { value: "deeti" },
			},
		);
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "secret123" },
		});

		fireEvent.click(
			screen.getByRole("button", { name: /initiate launch/i }),
		);

		expect(screen.getByRole("button")).toBeDisabled();
		expect(screen.getByRole("button")).toHaveTextContent(
			"Authenticating...",
		);

		resolveSignIn({ error: "CredentialsSignin" });

		expect(
			await screen.findByText("Invalid email/username or password."),
		).toBeInTheDocument();
	});
});