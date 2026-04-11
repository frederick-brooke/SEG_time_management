//tests for scheduler/src/components/modules/JoinModule.tsx

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import JoinModule from "@/components/modules/JoinModule";

// mocks
jest.mock("@/context/UIContext", () => ({
    useUI: () => ({
        setIsModalOpen: jest.fn(),
    }),
}));

jest.mock("@/app/actions/module", () => ({
  joinModule: jest.fn(),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useTransition: () => [false, (fn: any) => fn()],
}));

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

// tests
describe("JoinModule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirms the modal renders correctly with the expected input fields
  it("renders the join module form", () => {
    render(<JoinModule onClose={mockOnClose} />);
    expect(screen.getByText("Join Module")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("AB12CD")).toBeInTheDocument();
  });

  // Confirms the modal closes without any action when the Cancel button is clicked
  it("calls onClose when Cancel is clicked", () => {
    render(<JoinModule onClose={mockOnClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  // Confirms the input field automatically formats the PIN by uppercasing and truncating to 6 characters
  it("auto-uppercases and limits PIN input to 6 characters", () => {
    render(<JoinModule onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText("AB12CD");
    fireEvent.change(input, { target: { value: "abcdefgh" } });
    expect(input).toHaveValue("ABCDEF");
  });

  // Confirms the Join button remains disabled if the PIN is incomplete (less than 6 characters)
  it("disables Join button when PIN is under 6 characters", () => {
    render(<JoinModule onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText("AB12CD");
    fireEvent.change(input, { target: { value: "AB" } });
    expect(screen.getByText("Join")).toBeDisabled();
  });

  // Confirms the Join button is enabled only when a valid 6-character PIN is entered
  it("enables Join button only when PIN is exactly 6 characters", () => {
    render(<JoinModule onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText("AB12CD");
    fireEvent.change(input, { target: { value: "ABCDE" } });
    expect(screen.getByText("Join")).toBeDisabled();
    fireEvent.change(input, { target: { value: "ABCDEF" } });
    expect(screen.getByText("Join")).not.toBeDisabled();
  });

  // Confirms a specific server error message is displayed when the join attempt fails
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

  // Confirms the modal closes and triggers the success callback when joining is successful
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

  // Confirms a fallback error is shown if the server fails without providing a specific error message
  it("shows generic error when joinModule fails without specific error", async () => {
    const { joinModule } = require("@/app/actions/module");
    joinModule.mockResolvedValue({ success: false }); // No error string provided
    
    render(<JoinModule onClose={mockOnClose} />);
    fireEvent.change(screen.getByPlaceholderText("AB12CD"), { target: { value: "XXXXXX" } });
    fireEvent.click(screen.getByText("Join"));
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to join module/i)).toBeInTheDocument();
    });
  });
});