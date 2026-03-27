import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ForgotPasswordPage from "./page";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

global.fetch = jest.fn();

describe("ForgotPasswordPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the form initially", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText("Recover Access")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@universe.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Reset Link" })).toBeInTheDocument();
  });

  it("shows sending state while submitting", async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // never resolves
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText("you@universe.com"), { target: { value: "a@b.com" } });
    fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
    });
  });

  it("shows success message and Return to Login link on ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText("you@universe.com"), { target: { value: "a@b.com" } });
    fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("Recovery link transmitted. Check your inbox.")).toBeInTheDocument();
      expect(screen.getByText("Return to Login")).toBeInTheDocument();
    });
  });

  it("shows error message from response body on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email not found." }),
    });
    render(<ForgotPasswordPage />);
    fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("Email not found.")).toBeInTheDocument();
    });
  });

  it("shows fallback error message when response body has no error field", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });
    render(<ForgotPasswordPage />);
    fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("Failed to send recovery email.")).toBeInTheDocument();
    });
  });

  it("shows system error message when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network down"));
    render(<ForgotPasswordPage />);
    fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("System error. Please try again later.")).toBeInTheDocument();
    });
  });
});