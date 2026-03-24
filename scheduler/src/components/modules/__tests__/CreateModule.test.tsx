import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CreateModule from "@/components/modules/CreateModule";

//mocks
jest.mock("@/app/actions/module", () => ({
  createModule: jest.fn(),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useTransition: () => [false, (fn: any) => fn()],
}));

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

//tests
describe("CreateModule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the create module form", () => {
    render(<CreateModule onClose={mockOnClose} />);
    expect(screen.getByText("Create New Module")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Computer Science 101/i)).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    render(<CreateModule onClose={mockOnClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows an error when module creation fails", async () => {
    const { createModule } = require("@/app/actions/module");
    createModule.mockResolvedValue({ success: false, error: "Module name is required" });
    render(<CreateModule onClose={mockOnClose} />);
    fireEvent.change(screen.getByPlaceholderText(/Computer Science 101/i), {
      target: { value: "CS101" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => {
      expect(screen.getByText("Module name is required")).toBeInTheDocument();
    });
  });

  it("shows success state with PIN after creation", async () => {
    const { createModule } = require("@/app/actions/module");
    createModule.mockResolvedValue({
      success: true,
      module: { id: "mod1", name: "CS101" },
      joinPin: "ABC123",
    });
    render(<CreateModule onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    fireEvent.change(screen.getByPlaceholderText(/Computer Science 101/i), {
      target: { value: "CS101" },
    });
    fireEvent.click(screen.getByText("Create"));
    await waitFor(() => {
      expect(screen.getByText("Module Created!")).toBeInTheDocument();
      expect(screen.getByText("ABC123")).toBeInTheDocument();
    });
    expect(mockOnSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: "mod1" }),
      "ABC123"
    );
  });

  it("copies PIN to clipboard when Copy is clicked in success state", async () => {
    const { createModule } = require("@/app/actions/module");
    createModule.mockResolvedValue({
      success: true,
      module: { id: "mod1", name: "CS101" },
      joinPin: "XYZ789",
    });
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
    render(<CreateModule onClose={mockOnClose} />);
    fireEvent.change(screen.getByPlaceholderText(/Computer Science 101/i), {
      target: { value: "CS101" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => screen.getByText("XYZ789"));
    fireEvent.click(screen.getByText("Copy"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("XYZ789");
  });

  it("calls onClose when Done is clicked in success state", async () => {
    const { createModule } = require("@/app/actions/module");
    createModule.mockResolvedValue({
      success: true,
      module: { id: "mod1" },
      joinPin: "ABC123",
    });
    render(<CreateModule onClose={mockOnClose} />);
    fireEvent.change(screen.getByPlaceholderText(/Computer Science 101/i), {
      target: { value: "CS101" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
