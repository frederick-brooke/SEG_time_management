import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupSettingsModal from "@/components/groups/GroupSettingsModal";

// mocks
jest.mock("@/app/actions/groups", () => ({
  updateGroupSettings: jest.fn(),
  addGroupMember: jest.fn(),
  getMyFriendsForGroup: jest.fn().mockResolvedValue([
    { id: "f1", username: "bob", fname: "Bob" },
    { id: "f2", username: "carol", fname: "Carol" },
  ]),
}));

jest.mock("lucide-react", () => ({
  X: () => <svg data-testid="x-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
  UserPlus: () => <svg data-testid="user-plus-icon" />,
}));

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

const mockGroup = {
  id: "grp1",
  name: "Current Group Name",
  description: "Current description",
  members: [{ userId: "f1" }], // Bob is already in the group
};

// tests
describe("GroupSettingsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  // Confirms that the existing group details are injected into the text inputs on initial render
  it("pre-fills form with existing group details", async () => {
    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("Current Group Name")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Current description")).toBeInTheDocument();
    });
  });

  // Confirms the friends filter logic filters out friends who are already in the group
  it("fetches friends and filters out those already in the group", async () => {
    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText("Carol")).toBeInTheDocument();
      expect(screen.queryByText("Bob")).not.toBeInTheDocument(); // Filtered out!
    });
  });

  // Confirms modifying text fields and hitting save pushes the delta to the DB and triggers callbacks
  it("submits updated details and calls callbacks on success", async () => {
    const { updateGroupSettings } = require("@/app/actions/groups");
    updateGroupSettings.mockResolvedValue({ success: true });

    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => screen.getByText("Carol"));

    fireEvent.change(screen.getByDisplayValue("Current Group Name"), { target: { value: "New Group Name" } });
    
    await act(async () => { fireEvent.click(screen.getByText("Save Details")); });

    await waitFor(() => {
      expect(updateGroupSettings).toHaveBeenCalledWith("grp1", { name: "New Group Name", description: "Current description" });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // Confirms clicking "Add" next to a friend instantly fires the server action to drop them into the group
  it("calls addGroupMember when 'Add' is clicked next to a friend", async () => {
    const { addGroupMember } = require("@/app/actions/groups");
    addGroupMember.mockResolvedValue({ success: true });

    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => screen.getByText("Carol"));
    
    await act(async () => { fireEvent.click(screen.getByText("Add")); });

    await waitFor(() => {
      expect(addGroupMember).toHaveBeenCalledWith("grp1", "f2"); // "f2" is Carol's ID
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled(); // Modal stays open to add more friends
    });
  });

  // --- Negative Path & Validation Tests ---

  // Confirms HTML5 validation natively protects the group name input from being empty
  it("requires a group name to submit natively via HTML5", async () => {
    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByDisplayValue("Current Group Name"));
    
    const nameInput = screen.getByDisplayValue("Current Group Name");
    expect(nameInput).toBeRequired();
  });

  // Confirms an alert is shown when updating group settings fails with a specific server error
  it("alerts when updating group settings fails on the server", async () => {
    const { updateGroupSettings } = require("@/app/actions/groups");
    updateGroupSettings.mockResolvedValue({ success: false, error: "Failed to update settings" });

    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByDisplayValue("Current Group Name"));

    await act(async () => { fireEvent.click(screen.getByText("Save Details")); });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to update settings");
    });
  });

  // Confirms an alert is shown when adding a group member fails with a specific server error
  it("alerts when adding a group member fails on the server", async () => {
    const { addGroupMember } = require("@/app/actions/groups");
    addGroupMember.mockResolvedValue({ success: false, error: "Failed to add member" });

    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Carol"));

    await act(async () => { fireEvent.click(screen.getByText("Add")); });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to add member");
    });
  });

  // Confirms an alert fires safely even if the server provides no specific error string for adding a member
  it("alerts safely when adding a member fails silently", async () => {
    const { addGroupMember } = require("@/app/actions/groups");
    addGroupMember.mockResolvedValue({ success: false }); // No error string provided

    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Carol"));

    await act(async () => { fireEvent.click(screen.getByText("Add")); });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalled(); 
    });
  });

  // Confirms an alert fires safely even if the server provides no specific error string for saving settings
  it("alerts safely when saving details fails silently", async () => {
    const { updateGroupSettings } = require("@/app/actions/groups");
    updateGroupSettings.mockResolvedValue({ success: false }); // No error string provided

    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByDisplayValue("Current Group Name"));

    await act(async () => { fireEvent.click(screen.getByText("Save Details")); });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalled(); 
    });
  });
});