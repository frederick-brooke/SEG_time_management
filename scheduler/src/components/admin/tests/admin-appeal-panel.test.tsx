import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AppealPanel from "../admin-appeal-panel"; // adjust path if needed

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

describe("AppealPanel", () => {
  const mockOnClose = jest.fn();
  const mockFetchAppeals = jest.fn();

  const baseAppeal = {
    id: "appeal-123",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    description: "I was banned unfairly",
    user: { username: "testuser", email: "test@example.com" },
    report: { id: "report-1" },
    handledBy: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders nothing when no appeal is provided", () => {
    const { container } = render(
      <AppealPanel appeal={null} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders appeal details correctly", () => {
    render(
      <AppealPanel appeal={baseAppeal} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );

    expect(screen.getByText("Appeal Details")).toBeInTheDocument();
    expect(screen.getByText(baseAppeal.id)).toBeInTheDocument();
    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("report-1")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByText("Not handled yet")).toBeInTheDocument();
    expect(screen.getByText("I was banned unfairly")).toBeInTheDocument();
  });

  test("falls back to email if username is missing", () => {
    const appeal = {
      ...baseAppeal,
      user: { email: "fallback@example.com" },
    };

    render(
      <AppealPanel appeal={appeal} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );

    expect(screen.getByText("fallback@example.com")).toBeInTheDocument();
  });

  test("shows moderator notes when present", () => {
    const appeal = {
      ...baseAppeal,
      moderatorNotes: "Reviewed by admin",
    };

    render(
      <AppealPanel appeal={appeal} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );

    expect(screen.getByText("Moderator Notes")).toBeInTheDocument();
    expect(screen.getByText("Reviewed by admin")).toBeInTheDocument();
  });

  test("does not show action buttons when not PENDING", () => {
    const appeal = {
      ...baseAppeal,
      status: "APPROVED",
    };

    render(
      <AppealPanel appeal={appeal} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );

    expect(screen.queryByText(/Approve Appeal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reject Appeal/i)).not.toBeInTheDocument();
  });

  test("calls onClose when clicking overlay", () => {
    render(
      <AppealPanel appeal={baseAppeal} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );

    const overlay = screen.getByText("Appeal Details").closest("div").parentElement.parentElement;
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test("does NOT close when clicking inside panel", () => {
    render(
      <AppealPanel appeal={baseAppeal} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );

    fireEvent.click(screen.getByText("Appeal Details"));

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test("approve action calls API and triggers callbacks", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(
      <AppealPanel appeal={baseAppeal} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );

    fireEvent.click(screen.getByText(/Approve Appeal/i));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/admin/appeals/${baseAppeal.id}`,
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });

    expect(mockFetchAppeals).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("reject action calls API and triggers callbacks", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(
      <AppealPanel appeal={baseAppeal} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );

    fireEvent.click(screen.getByText(/Reject Appeal/i));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/admin/appeals/${baseAppeal.id}`,
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });

    expect(mockFetchAppeals).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("buttons are disabled while loading", async () => {
    let resolveFetch;
    (fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(
      <AppealPanel appeal={baseAppeal} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );

    const approveBtn = screen.getByText(/Approve Appeal/i);

    fireEvent.click(approveBtn);

    expect(approveBtn).toBeDisabled();

    resolveFetch({ ok: true });

    await waitFor(() => {
      expect(approveBtn).not.toBeDisabled();
    });
  });

  test("close button works", () => {
    render(
      <AppealPanel appeal={baseAppeal} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );

    fireEvent.click(screen.getByText("Close"));

    expect(mockOnClose).toHaveBeenCalled();
  });

  test("handles missing optional fields gracefully", () => {
    const appeal = {
      id: "123",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    render(
      <AppealPanel appeal={appeal} onClose={mockOnClose} fetchAppeals={mockFetchAppeals} />
    );

    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("No explanation provided.")).toBeInTheDocument();
  });
});