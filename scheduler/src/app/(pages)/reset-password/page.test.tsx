import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ResetPasswordContent } from "./page";

import { useSearchParams, useRouter } from "next/navigation";
import { validatePassword } from "@/lib/password";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/lib/password", () => ({
  validatePassword: jest.fn(),
}));

global.fetch = jest.fn();

describe("ResetPasswordContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
  });

  function mockToken(token: string | null) {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => token,
    });
  }

  function fillPasswords(password: string, confirm: string) {
  const passwordInput = screen.getByLabelText(/new password/i);
  const confirmInput = screen.getByLabelText(/confirm password/i);

  fireEvent.change(passwordInput, { target: { value: password } });
  fireEvent.change(confirmInput, { target: { value: confirm } });
}

  it("shows error when token is missing", async () => {
    mockToken(null);

    render(<ResetPasswordContent />);

    expect(
      screen.getByText(/invalid or missing token/i)
    ).toBeInTheDocument();
  });

  it("shows password mismatch error", async () => {
    mockToken("valid-token");
    (validatePassword as jest.Mock).mockReturnValue(null);

    render(<ResetPasswordContent />);

    fillPasswords("Password123!", "Different123!");

    fireEvent.click(screen.getByText(/save password/i));

    await waitFor(() => {
      expect(
        screen.getByText(/passwords do not match/i)
      ).toBeInTheDocument();
    });
  });

  it("handles successful reset", async () => {
    mockToken("valid-token");
    (validatePassword as jest.Mock).mockReturnValue(null);

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(<ResetPasswordContent />);

    fillPasswords("StrongPass123!", "StrongPass123!");

    fireEvent.click(screen.getByText(/save password/i));

    await waitFor(() => {
      expect(
        screen.getByText(/password reset successful/i)
      ).toBeInTheDocument();
    });
  });
});