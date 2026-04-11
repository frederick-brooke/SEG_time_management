//tests for scheduler/src/components/modules/ModuleSettingsModal.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModuleSettingsModal from "../ModuleSettingsModal";
import { updateModuleSettings } from "@/app/actions/module";

// Mock the server action
jest.mock("@/app/actions/module", () => ({
  updateModuleSettings: jest.fn(),
}));

// Mock icons to keep the DOM clean
jest.mock("lucide-react", () => ({
  Settings: () => <svg data-testid="settings-icon" />,
  X: () => <svg data-testid="close-icon" />,
}));

const mockUpdateModuleSettings = updateModuleSettings as jest.Mock;

describe("ModuleSettingsModal Component", () => {
  const mockModule = {
    id: "mod-123",
    name: "Advanced Calculus",
    description: "Derivatives and Integrals",
    maxMembers: 50,
    memberCount: 15,
  };

  const baseProps = {
    module: mockModule,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes form fields with the provided module data", () => {
    render(<ModuleSettingsModal {...baseProps} />);
    
    expect(screen.getByLabelText(/module name/i)).toHaveValue("Advanced Calculus");
    expect(screen.getByLabelText(/description/i)).toHaveValue("Derivatives and Integrals");
    expect(screen.getByLabelText(/max members/i)).toHaveValue(50);
    expect(screen.getByText(/Currently using 15 of 50 spots/i)).toBeInTheDocument();
  });

  it("enforces the current member count as the minimum capacity limit", () => {
    render(<ModuleSettingsModal {...baseProps} />);
    const maxMembersInput = screen.getByLabelText(/max members/i);
    
    expect(maxMembersInput).toHaveAttribute("min", "15");
  });

  it("updates local form state when the user types in the input fields", async () => {
    const user = userEvent.setup();
    render(<ModuleSettingsModal {...baseProps} />);
    
    const nameInput = screen.getByLabelText(/module name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Linear Algebra");
    
    expect(nameInput).toHaveValue("Linear Algebra");
  });

  it("dispatches the update action with correct payload on form submission", async () => {
    const user = userEvent.setup();
    mockUpdateModuleSettings.mockResolvedValue({ success: true });
    render(<ModuleSettingsModal {...baseProps} />);
    const maxMembersInput = screen.getByLabelText(/max members/i);
    fireEvent.change(maxMembersInput, { target: { value: "100" } });

    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(mockUpdateModuleSettings).toHaveBeenCalledWith("mod-123", {
        name: "Advanced Calculus",
        description: "Derivatives and Integrals",
        maxMembers: 100,
      });
    });
  });

  it("triggers success and close callbacks after a successful update", async () => {
    const user = userEvent.setup();
    mockUpdateModuleSettings.mockResolvedValue({ success: true });
    render(<ModuleSettingsModal {...baseProps} />);

    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(baseProps.onSuccess).toHaveBeenCalled();
      expect(baseProps.onClose).toHaveBeenCalled();
    });
  });

  it("displays an error message and prevents closure if the API rejects the update", async () => {
    const user = userEvent.setup();
    mockUpdateModuleSettings.mockResolvedValue({ success: false, error: "Capacity cannot be reduced below current members." });
    render(<ModuleSettingsModal {...baseProps} />);

    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(screen.getByText("Capacity cannot be reduced below current members.")).toBeInTheDocument();
      expect(baseProps.onSuccess).not.toHaveBeenCalled();
      expect(baseProps.onClose).not.toHaveBeenCalled();
    });
  });

  it("closes the modal when the cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<ModuleSettingsModal {...baseProps} />);
    
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it("closes the modal when the overlay background is clicked", async () => {
    const user = userEvent.setup();
    render(<ModuleSettingsModal {...baseProps} />);
    
    // The overlay is the outermost div wrapping the modal card
    const overlay = screen.getByRole("button", { name: /cancel/i }).closest(".lunar-overlay");
    if (overlay) await user.click(overlay);
    
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it("prevents modal closure when clicking inside the main card area", async () => {
    const user = userEvent.setup();
    render(<ModuleSettingsModal {...baseProps} />);
    
    // Click the actual modal card to ensure stopPropagation works
    const card = screen.getByText(/module settings/i).closest(".lunar-card");
    if (card) await user.click(card);
    
    expect(baseProps.onClose).not.toHaveBeenCalled();
  });
});