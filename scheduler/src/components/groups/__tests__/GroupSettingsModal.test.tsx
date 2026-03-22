import React from "react";
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

describe("GroupSettingsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Verifies that the existing group details are injected into the 
   * text inputs on initial render.
   */
  it("pre-fills form with existing group details", async () => {
    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("Current Group Name")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Current description")).toBeInTheDocument();
    });
  });

  /**
   * Tests the friends filter logic. Since Bob ("f1") is already in `mockGroup.members`, 
   * only Carol should appear in the "Add Friends" list.
   */
  it("fetches friends and filters out those already in the group", async () => {
    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText("Carol")).toBeInTheDocument();
      expect(screen.queryByText("Bob")).not.toBeInTheDocument(); // Filtered out!
    });
  });

  /**
   * Tests the "Section 1" form update logic. Modifying the text fields and 
   * hitting save should push the delta to the database and trigger callbacks.
   */
  it("submits updated details and calls callbacks on success", async () => {
    const { updateGroupSettings } = require("@/app/actions/groups");
    updateGroupSettings.mockResolvedValue({ success: true });

    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    // Await friend load to ensure component is fully mounted
    await waitFor(() => screen.getByText("Carol"));

    fireEvent.change(screen.getByDisplayValue("Current Group Name"), { target: { value: "New Group Name" } });
    
    await act(async () => { fireEvent.click(screen.getByText("Save Details")); });

    await waitFor(() => {
      expect(updateGroupSettings).toHaveBeenCalledWith("grp1", { name: "New Group Name", description: "Current description" });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  /**
   * Tests the "Section 2" instant-add logic. Clicking "Add" next to a friend 
   * should instantly fire the server action to drop them into the group.
   */
  it("calls addGroupMember when 'Add' is clicked next to a friend", async () => {
    const { addGroupMember } = require("@/app/actions/groups");
    addGroupMember.mockResolvedValue({ success: true });

    render(<GroupSettingsModal group={mockGroup} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => screen.getByText("Carol"));
    
    // Add Carol
    await act(async () => { fireEvent.click(screen.getByText("Add")); });

    await waitFor(() => {
      expect(addGroupMember).toHaveBeenCalledWith("grp1", "f2"); // "f2" is Carol's ID
      expect(mockOnSuccess).toHaveBeenCalled();
      // NOTE: We don't call onClose here intentionally so they can keep adding multiple friends
      expect(mockOnClose).not.toHaveBeenCalled(); 
    });
  });
});