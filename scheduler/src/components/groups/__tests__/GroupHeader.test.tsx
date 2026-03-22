import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupHeader from "@/components/groups/GroupHeader";
import { useRouter } from "next/navigation";

// mocks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/app/actions/groups", () => ({
  leaveGroup: jest.fn(),
  deleteGroup: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  Users: () => <svg data-testid="users-icon" />,
  ListTodo: () => <svg data-testid="list-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  Trash: () => <svg data-testid="trash-icon" />,
  LogOut: () => <svg data-testid="logout-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
}));

const mockOnOpenTaskModal = jest.fn();
const mockOnOpenEventModal = jest.fn();
const mockOnOpenSettings = jest.fn();

const mockGroup = {
  id: "grp1",
  name: "Physics Project",
  description: "Building a rocket",
  memberCount: 3,
  creator: { username: "einstein" },
};

describe("GroupHeader", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    window.confirm = jest.fn(() => true); // Auto-confirm destructive actions
  });

  /**
   * Verifies that the header correctly displays the fundamental group data 
   * (title, description, member count, and creator attribution).
   */
  it("renders group details correctly", () => {
    render(
      <GroupHeader
        group={mockGroup}
        isOwner={false}
        onOpenTaskModal={mockOnOpenTaskModal}
        onOpenEventModal={mockOnOpenEventModal}
        onOpenSettings={mockOnOpenSettings}
      />
    );
    expect(screen.getByText("Physics Project")).toBeInTheDocument();
    expect(screen.getByText("Building a rocket")).toBeInTheDocument();
    expect(screen.getByText(/3 members/i)).toBeInTheDocument();
    expect(screen.getByText("Created by @einstein")).toBeInTheDocument();
  });

  /**
   * Tests the permission matrix for the Group Owner. They should see the 
   * Settings button and the destructive Delete Group button.
   */
  it("renders owner-specific buttons when user is owner", () => {
    render(
      <GroupHeader
        group={mockGroup}
        isOwner={true}
        onOpenTaskModal={mockOnOpenTaskModal}
        onOpenEventModal={mockOnOpenEventModal}
        onOpenSettings={mockOnOpenSettings}
      />
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Delete Group")).toBeInTheDocument();
    expect(screen.queryByText("Leave Group")).not.toBeInTheDocument();
  });

  /**
   * Tests the permission matrix for a regular member. They should NOT see 
   * Settings or Delete, but they should see the Leave Group button. 
   * (Note: Both owners and members can see Create Task/Event in peer groups).
   */
  it("renders member-specific buttons when user is not owner", () => {
    render(
      <GroupHeader
        group={mockGroup}
        isOwner={false}
        onOpenTaskModal={mockOnOpenTaskModal}
        onOpenEventModal={mockOnOpenEventModal}
        onOpenSettings={mockOnOpenSettings}
      />
    );
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete Group")).not.toBeInTheDocument();
    expect(screen.getByText("Leave Group")).toBeInTheDocument();
    expect(screen.getByText("Create Task")).toBeInTheDocument();
    expect(screen.getByText("Create Event")).toBeInTheDocument();
  });

  /**
   * Ensures that the modal trigger buttons fire their respective 
   * callbacks passed down from the parent component.
   */
  it("fires modal callbacks when create/settings buttons are clicked", () => {
    render(
      <GroupHeader
        group={mockGroup}
        isOwner={true}
        onOpenTaskModal={mockOnOpenTaskModal}
        onOpenEventModal={mockOnOpenEventModal}
        onOpenSettings={mockOnOpenSettings}
      />
    );
    fireEvent.click(screen.getByText("Create Task"));
    expect(mockOnOpenTaskModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Create Event"));
    expect(mockOnOpenEventModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Settings"));
    expect(mockOnOpenSettings).toHaveBeenCalledTimes(1);
  });

  /**
   * Tests the destructive Leave Group flow. Verifies it asks for confirmation, 
   * calls the correct server action, and redirects the user upon success.
   */
  it("calls leaveGroup and redirects when Leave Group is confirmed", async () => {
    const { leaveGroup } = require("@/app/actions/groups");
    leaveGroup.mockResolvedValue({ success: true });

    render(
      <GroupHeader
        group={mockGroup}
        isOwner={false}
        onOpenTaskModal={mockOnOpenTaskModal}
        onOpenEventModal={mockOnOpenEventModal}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    fireEvent.click(screen.getByText("Leave Group"));
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(leaveGroup).toHaveBeenCalledWith("grp1");
      expect(mockPush).toHaveBeenCalledWith("/groups");
    });
  });

  /**
   * Tests the ultimate destructive action (Delete Group). Verifies it calls 
   * the specific delete action and safely redirects the owner away from the page.
   */
  it("calls deleteGroup and redirects when Delete Group is confirmed", async () => {
    const { deleteGroup } = require("@/app/actions/groups");
    deleteGroup.mockResolvedValue({ success: true });

    render(
      <GroupHeader
        group={mockGroup}
        isOwner={true}
        onOpenTaskModal={mockOnOpenTaskModal}
        onOpenEventModal={mockOnOpenEventModal}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    fireEvent.click(screen.getByText("Delete Group"));
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(deleteGroup).toHaveBeenCalledWith("grp1");
      expect(mockPush).toHaveBeenCalledWith("/groups");
    });
  });
});