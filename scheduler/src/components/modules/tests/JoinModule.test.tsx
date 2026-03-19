import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import JoinModule from "@/components/modules/JoinModule";

//mocks
jest.mock("@/app/actions/module", () => ({
  joinModule: jest.fn(),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useTransition: () => [false, (fn: any) => fn()],
}));

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

//tests
describe("JoinModule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the join module form", () => {
    render(<JoinModule onClose={mockOnClose} />);
    expect(screen.getByText("Join Module")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("AB12CD")).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    render(<JoinModule onClose={mockOnClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("auto-uppercases and limits PIN input to 6 characters", () => {
    render(<JoinModule onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText("AB12CD");
    fireEvent.change(input, { target: { value: "abcdefgh" } });
    expect(input).toHaveValue("ABCDEF");
  });

  it("disables Join button when PIN is under 6 characters", () => {
    render(<JoinModule onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText("AB12CD");
    fireEvent.change(input, { target: { value: "AB" } });
    expect(screen.getByText("Join")).toBeDisabled();
  });

  it("enables Join button only when PIN is exactly 6 characters", () => {
    render(<JoinModule onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText("AB12CD");
    fireEvent.change(input, { target: { value: "ABCDE" } });
    expect(screen.getByText("Join")).toBeDisabled();
    fireEvent.change(input, { target: { value: "ABCDEF" } });
    expect(screen.getByText("Join")).not.toBeDisabled();
  });

  it("shows server error when joinModule fails", async () => {
    const { joinModule } = require("@/app/actions/module");
    joinModule.mockResolvedValue({ success: false, error: "Invalid PIN - Module not found" });
    render(<JoinModule onClose={mockOnClose} />);
    fireEvent.change(screen.getByPlaceholderText("AB12CD"), { target: { value: "XXXXXX" } });
    fireEvent.click(screen.getByText("Join"));
    await waitFor(() => {
      expect(screen.getByText("Invalid PIN - Module not found")).toBeInTheDocument();
    });
  });

  it("calls onSuccess and onClose when join succeeds", async () => {
    const { joinModule } = require("@/app/actions/module");
    joinModule.mockResolvedValue({ success: true, module: { id: "mod1", name: "CS101" } });
    render(<JoinModule onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByPlaceholderText("AB12CD"), { target: { value: "ABC123" } });
    fireEvent.click(screen.getByText("Join"));
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: "mod1" }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
