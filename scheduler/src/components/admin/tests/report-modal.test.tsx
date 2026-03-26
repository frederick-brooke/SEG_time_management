import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportModal from "../report-modal";

global.fetch = jest.fn();
global.alert = jest.fn();
console.error = jest.fn();

const onClose = jest.fn();

const setup = () => {
  render(
    <ReportModal
      reportedUserId="123"
      reportedUsername="testuser"
      onClose={onClose}
    />
  );
};

describe("ReportModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders modal content correctly", () => {
    setup();

    expect(screen.getByText("Report User")).toBeInTheDocument();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.getByText("Submit Report")).toBeInTheDocument();
  });

  test("close button calls onClose", () => {
    setup();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onClose).toHaveBeenCalled();
  });

  test("cancel button calls onClose", () => {
    setup();
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  test("submit button disabled when no reason", () => {
    setup();
    expect(screen.getByText("Submit Report")).toBeDisabled();
  });

  test("allows selecting reason and typing description", () => {
    setup();

    const select = screen.getByRole("combobox");
    const textarea = screen.getByPlaceholderText(/provide more context/i);

    fireEvent.change(select, { target: { value: "SPAM" } });
    fireEvent.change(textarea, { target: { value: "details" } });

    expect((select as HTMLSelectElement).value).toBe("SPAM");
    expect((textarea as HTMLTextAreaElement).value).toBe("details");
  });

  test("successful submit calls API, alerts success, and closes", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    setup();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "SPAM" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/report", expect.any(Object));
      expect(alert).toHaveBeenCalledWith("Report submitted successfully.");
      expect(onClose).toHaveBeenCalled();
    });
  });

  test("API error shows alert message", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Bad request" }),
    });

    setup();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "SPAM" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith("Bad request");
    });
  });

  test("network error shows fallback alert and logs error", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("fail"));

    setup();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "SPAM" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(alert).toHaveBeenCalledWith("Failed to submit report");
    });
  });

  test("shows loading state while submitting", async () => {
    let resolveFetch: any;

    (fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    setup();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "SPAM" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    expect(screen.getByText("Submitting…")).toBeInTheDocument();

    resolveFetch({
      ok: true,
      json: async () => ({}),
    });

    await waitFor(() => {
      expect(screen.getByText("Submit Report")).toBeInTheDocument();
    });
  });
});