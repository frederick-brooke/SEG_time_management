import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupHeader from "@/components/groups/GroupHeader";
import { useRouter } from "next/navigation";
import { leaveGroup, deleteGroup } from "@/app/actions/groups";

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

// tests
describe("GroupHeader", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    window.confirm = jest.fn(() => true); 
    window.alert = jest.fn(); 
  });

  // Confirms that the header correctly displays the fundamental group data
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

  // Confirms the permission matrix for the Group Owner (sees Settings and Delete)
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

  // Confirms the permission matrix for a regular member (sees Leave Group, not Settings)
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

  // Confirms that the modal trigger buttons fire their respective callbacks
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

  // Confirms the happy path for the Leave Group flow
  it("calls leaveGroup and redirects when Leave Group is confirmed", async () => {
    (leaveGroup as jest.Mock).mockResolvedValue({ success: true });

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

  // Confirms the happy path for the Delete Group flow
  it("calls deleteGroup and redirects when Delete Group is confirmed", async () => {
    (deleteGroup as jest.Mock).mockResolvedValue({ success: true });

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

  // --- Negative Path Tests (Coverage for lines 47 & 58) ---

  // Confirms leaving the group is aborted if the user clicks Cancel on the prompt
  it("aborts leave group when confirmation is cancelled", () => {
    window.confirm = jest.fn(() => false);
    render(
      <GroupHeader group={mockGroup} isOwner={false} onOpenTaskModal={mockOnOpenTaskModal} onOpenEventModal={mockOnOpenEventModal} onOpenSettings={mockOnOpenSettings} />
    );
    
    fireEvent.click(screen.getByText("Leave Group"));
    expect(leaveGroup).not.toHaveBeenCalled();
  });

  // Confirms an alert is shown when the leave group server action fails
  it("alerts when leave group fails on the server", async () => {
    (leaveGroup as jest.Mock).mockResolvedValue({ success: false, error: "Cannot leave group" });
    render(
      <GroupHeader group={mockGroup} isOwner={false} onOpenTaskModal={mockOnOpenTaskModal} onOpenEventModal={mockOnOpenEventModal} onOpenSettings={mockOnOpenSettings} />
    );
    
    fireEvent.click(screen.getByText("Leave Group"));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Cannot leave group");
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // Confirms deleting the group is aborted if the user clicks Cancel on the prompt
  it("aborts delete group when confirmation is cancelled", () => {
    window.confirm = jest.fn(() => false);
    render(
      <GroupHeader group={mockGroup} isOwner={true} onOpenTaskModal={mockOnOpenTaskModal} onOpenEventModal={mockOnOpenEventModal} onOpenSettings={mockOnOpenSettings} />
    );
    
    fireEvent.click(screen.getByText("Delete Group"));
    expect(deleteGroup).not.toHaveBeenCalled();
  });

  // Confirms an alert is shown when the delete group server action fails
  it("alerts when delete group fails on the server", async () => {
    (deleteGroup as jest.Mock).mockResolvedValue({ success: false, error: "Cannot delete group" });
    render(
      <GroupHeader group={mockGroup} isOwner={true} onOpenTaskModal={mockOnOpenTaskModal} onOpenEventModal={mockOnOpenEventModal} onOpenSettings={mockOnOpenSettings} />
    );
    
    fireEvent.click(screen.getByText("Delete Group"));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Cannot delete group");
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
  // Confirms the singular "member" string is rendered correctly
  it("renders singular 'member' text when group has exactly 1 member", () => {
    const singleMemberGroup = { ...mockGroup, memberCount: 1 };
    render(<GroupHeader group={singleMemberGroup} isOwner={true} onOpenTaskModal={mockOnOpenTaskModal} onOpenEventModal={mockOnOpenEventModal} onOpenSettings={mockOnOpenSettings} />);
    expect(screen.getByText(/1 member/i)).toBeInTheDocument();
    expect(screen.queryByText(/members/i)).not.toBeInTheDocument();
  });

  // Confirms fallback errors for server failures
  it("alerts on silent server failures for leave and delete", async () => {
    (leaveGroup as jest.Mock).mockResolvedValue({ success: false });
    (deleteGroup as jest.Mock).mockResolvedValue({ success: false });
    
    const { rerender } = render(<GroupHeader group={mockGroup} isOwner={false} onOpenTaskModal={mockOnOpenTaskModal} onOpenEventModal={mockOnOpenEventModal} onOpenSettings={mockOnOpenSettings} />);
    fireEvent.click(screen.getByText("Leave Group"));
    await waitFor(() => expect(window.alert).toHaveBeenCalled());

    rerender(<GroupHeader group={mockGroup} isOwner={true} onOpenTaskModal={mockOnOpenTaskModal} onOpenEventModal={mockOnOpenEventModal} onOpenSettings={mockOnOpenSettings} />);
    fireEvent.click(screen.getByText("Delete Group"));
    await waitFor(() => expect(window.alert).toHaveBeenCalledTimes(2));
  });
});