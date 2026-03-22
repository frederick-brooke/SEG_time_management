import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModuleSettingsModal from "../ModuleSettingsModal";
import { updateModuleSettings } from "@/app/actions/module";

//mocks
jest.mock("@/app/actions/module", () => ({
  updateModuleSettings: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  X: () => <svg data-testid="x-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
}));

//tests
describe("ModuleSettingsModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  const mockModule = {
    id: "mod-123",
    name: "Physics 101",
    description: "Introductory physics",
    maxMembers: 50,
    memberCount: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with the initial module data populated", () => {
    render(
      <ModuleSettingsModal
        module={mockModule}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByDisplayValue("Physics 101")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Introductory physics")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();
    expect(screen.getByText("Currently using 10 of 50 spots.")).toBeInTheDocument();
  });

  it("calls onClose when the cancel button is clicked", () => {
    render(
      <ModuleSettingsModal
        module={mockModule}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("submits the updated data and calls onSuccess on successful response", async () => {
    // Mock a successful backend response
    (updateModuleSettings as jest.Mock).mockResolvedValue({ success: true });

    render(
      <ModuleSettingsModal
        module={mockModule}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Change the form values
    fireEvent.change(screen.getByDisplayValue("Physics 101"), {
      target: { value: "Advanced Physics" },
    });
    fireEvent.change(screen.getByDisplayValue("50"), {
      target: { value: "100" },
    });

    // Submit the form
    fireEvent.click(screen.getByText("Save Settings"));

    // Verify the server action was called with the correct data
    await waitFor(() => {
      expect(updateModuleSettings).toHaveBeenCalledWith("mod-123", {
        name: "Advanced Physics",
        description: "Introductory physics",
        maxMembers: 100,
      });
    });

    // Verify it called the success and close callbacks
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("displays an error message if the server action fails", async () => {
    // Mock a failed backend response
    (updateModuleSettings as jest.Mock).mockResolvedValue({
      success: false,
      error: "Maximum capacity cannot be lower than current member count",
    });

    render(
      <ModuleSettingsModal
        module={mockModule}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByText("Save Settings"));

    // Verify the error renders on screen
    await waitFor(() => {
      expect(
        screen.getByText("Maximum capacity cannot be lower than current member count")
      ).toBeInTheDocument();
    });

    // Callbacks should not be called
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});