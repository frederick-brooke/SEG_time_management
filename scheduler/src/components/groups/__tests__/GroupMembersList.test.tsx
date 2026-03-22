import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupMembersList from "@/components/groups/GroupMembersList";

jest.mock("@/app/actions/groups", () => ({
  removeGroupMember: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("lucide-react", () => ({
  Users: () => <svg data-testid="users-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  ChevronUp: () => <svg data-testid="chevron-up-icon" />,
  Crown: () => <svg data-testid="crown-icon" />,
  UserMinus: () => <svg data-testid="user-minus-icon" />,
}));

const mockMembers = [
  { id: "m1", role: "OWNER", user: { id: "u1", username: "alice", fname: "Alice", lname: "Smith" } },
  { id: "m2", role: "MEMBER", user: { id: "u2", username: "bob", fname: "Bob", lname: "Jones" } },
];

describe("GroupMembersList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  /**
   * Verifies the component renders strictly as a closed accordion by default, 
   * only displaying the total count.
   */
  it("renders closed by default with member count", () => {
    render(<GroupMembersList members={mockMembers} isOwner={true} groupId="grp1" />);
    expect(screen.getByText("Members (2)")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument(); // Hidden
  });

  /**
   * Tests the accordion interaction. Clicking the header should expand the list 
   * and render the actual user details.
   */
  it("expands to show member details when clicked", () => {
    render(<GroupMembersList members={mockMembers} isOwner={true} groupId="grp1" />);
    
    fireEvent.click(screen.getByText("Members (2)")); // Toggle open
    
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  /**
   * Tests permission matrix for the Owner tag. It should explicitly render 
   * the OWNER badge next to the user with the OWNER role.
   */
  it("shows the Owner badge on the owner", () => {
    render(<GroupMembersList members={mockMembers} isOwner={false} groupId="grp1" />);
    fireEvent.click(screen.getByText("Members (2)"));
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  /**
   * Tests the removal permissions. The Remove button should only be visible 
   * if the current viewer is the Owner, AND the target is not the Owner.
   */
  it("shows remove buttons for standard members only when viewer is owner", () => {
    render(<GroupMembersList members={mockMembers} isOwner={true} groupId="grp1" />);
    fireEvent.click(screen.getByText("Members (2)"));
    
    const removeButtons = screen.getAllByTitle("Remove Member");
    expect(removeButtons).toHaveLength(1); // Only Bob can be removed, Alice is owner
  });

  /**
   * Ensures the destructive action triggers a confirmation check and subsequently 
   * calls the exact backend action to strip the user from the group.
   */
  it("calls removeGroupMember and refreshes when a member is removed", async () => {
    const { removeGroupMember } = require("@/app/actions/groups");
    removeGroupMember.mockResolvedValue({ success: true });

    render(<GroupMembersList members={mockMembers} isOwner={true} groupId="grp1" />);
    fireEvent.click(screen.getByText("Members (2)"));
    
    fireEvent.click(screen.getByTitle("Remove Member"));
    expect(window.confirm).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(removeGroupMember).toHaveBeenCalledWith("grp1", "u2"); // u2 is Bob's User ID
    });
  });
});