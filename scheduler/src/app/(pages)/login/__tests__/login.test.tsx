/**
 * Testing for login page.
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock("@/components/admin/ban-message-page", () => ({
  __esModule: true,
  default: () => <div data-testid="banned-page">Banned</div>,
}));

global.fetch = jest.fn();

describe("LoginPage", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: mockReplace });
    (useSearchParams as jest.Mock).mockReturnValue({ get: () => null });
    (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" });
  });

  it("renders loading state", async () => {
    (useSession as jest.Mock).mockReturnValue({ status: "loading" });
    await act(async () => { render(<LoginPage />); });
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("redirects to dashboard when authenticated without error", async () => {
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" });
    await act(async () => { render(<LoginPage />); });
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects to dashboard with error when authenticated with error param", async () => {
    (useSearchParams as jest.Mock).mockReturnValue({ get: () => "TestError" });
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" });
    await act(async () => { render(<LoginPage />); });
    expect(mockReplace).toHaveBeenCalledWith("/dashboard?error=TestError");
  });

  it("shows AccessDenied error from URL", async () => {
    (useSearchParams as jest.Mock).mockReturnValue({ get: (key: string) => key === "error" ? "AccessDenied" : null });
    await act(async () => { render(<LoginPage />); });
    expect(screen.getByText("Access denied. Please check your credentials.")).toBeInTheDocument();
  });

  it("shows invalid credentials error", async () => {
    (signIn as jest.Mock).mockResolvedValue({ error: "CredentialsSignin" });
    await act(async () => { render(<LoginPage />); });
    fireEvent.change(screen.getByPlaceholderText("e.g. jsmith or john@example.com"), { target: { value: "test" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Initiate Launch" }));
    await waitFor(() => {
      expect(screen.getByText("Invalid email/username or password.")).toBeInTheDocument();
    });
  });

  it("shows banned error and BannedPage component", async () => {
    (signIn as jest.Mock).mockResolvedValue({ error: "Banned" });
    await act(async () => { render(<LoginPage />); });
    fireEvent.submit(screen.getByRole("button", { name: "Initiate Launch" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("Your account has been banned.")).toBeInTheDocument();
      expect(screen.getByTestId("banned-page")).toBeInTheDocument();
    });
  });

  it("shows error if session lacks user id", async () => {
    (signIn as jest.Mock).mockResolvedValue({});
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ user: {} }),
    });
    await act(async () => { render(<LoginPage />); });
    fireEvent.submit(screen.getByRole("button", { name: "Initiate Launch" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("Failed to get user session.")).toBeInTheDocument();
    });
  });

  it("redirects to dashboard if user has preferences", async () => {
    (signIn as jest.Mock).mockResolvedValue({});
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => ({ user: { id: "123" } }) })
      .mockResolvedValueOnce({ json: async () => ({ hasPreferences: true }) });
    await act(async () => { render(<LoginPage />); });
    fireEvent.submit(screen.getByRole("button", { name: "Initiate Launch" }).closest("form")!);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("redirects to quiz if user has no preferences", async () => {
    (signIn as jest.Mock).mockResolvedValue({});
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => ({ user: { id: "123" } }) })
      .mockResolvedValueOnce({ json: async () => ({ hasPreferences: false }) });
    await act(async () => { render(<LoginPage />); });
    fireEvent.submit(screen.getByRole("button", { name: "Initiate Launch" }).closest("form")!);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/quiz");
    });
  });

  it("shows generic error if fetch throws an exception", async () => {
    (signIn as jest.Mock).mockResolvedValue({});
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));
    await act(async () => { render(<LoginPage />); });
    fireEvent.submit(screen.getByRole("button", { name: "Initiate Launch" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("An unexpected error occurred during login.")).toBeInTheDocument();
    });
  });
});