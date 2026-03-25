import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupMembersList from "@/components/groups/GroupMembersList";

// mocks
jest.mock("@/app/actions/groups", () => ({
  removeGroupMember: jest.fn(),
}));

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

// Mock data including edge cases for name fallbacks and avatars
const mockMembers = [
  { id: "m1", role: "OWNER", user: { id: "u1", username: "alice", fname: "Alice", lname: "Smith", pfp: "https://avatar.com/alice.png" } }, 
  { id: "m2", role: "MEMBER", user: { id: "u2", username: "bob", fname: "Bob", lname: null, pfp: null } },
  { id: "m3", role: "MEMBER", user: { id: "u3", username: "charlie", fname: null, lname: null, pfp: null } },
];

// tests
describe("GroupMembersList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  // --- Initial Render & UI States ---

  // Confirms the component renders strictly as a closed accordion by default
  it("renders closed by default with member count", () => {
    render(<GroupMembersList members={mockMembers} isOwner={true} groupId="grp1" />);
    expect(screen.getByText("Members (3)")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  // Confirms clicking the header expands the accordion and correctly formats fallback names
  it("expands to show member details and handles missing name fallbacks", () => {
    render(<GroupMembersList members={mockMembers} isOwner={true} groupId="grp1" />);
    
    fireEvent.click(screen.getByText("Members (3)")); 
    
    // Member 1: Full name provided
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    // Member 2: Missing last name (falls back to just first name)
    expect(screen.getByText("Bob")).toBeInTheDocument();
    // Member 3: Missing first and last name (falls back to username)
    expect(screen.getAllByText("@charlie").length).toBeGreaterThan(0);
  });

  // Confirms the Owner badge is explicitly rendered next to the user with the OWNER role
  it("shows the Owner badge on the owner", () => {
    render(<GroupMembersList members={mockMembers} isOwner={false} groupId="grp1" />);
    fireEvent.click(screen.getByText("Members (3)"));
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  // --- Member Management & Permissions ---

  // Confirms the Remove button is only visible to the Owner, and only for non-owner members
  it("shows remove buttons for standard members only when viewer is owner", () => {
    render(<GroupMembersList members={mockMembers} isOwner={true} groupId="grp1" />);
    fireEvent.click(screen.getByText("Members (3)"));
    
    const removeButtons = screen.getAllByTitle("Remove Member");
    // Bob and Charlie can be removed; Alice is the owner and cannot be removed
    expect(removeButtons).toHaveLength(2); 
  });

  // Confirms the destructive action triggers a confirmation check and calls the backend action
  it("calls removeGroupMember and refreshes when a member is removed", async () => {
    const { removeGroupMember } = require("@/app/actions/groups");
    removeGroupMember.mockResolvedValue({ success: true });

    render(<GroupMembersList members={mockMembers} isOwner={true} groupId="grp1" />);
    fireEvent.click(screen.getByText("Members (3)"));
    
    // Trigger remove for Bob (u2)
    fireEvent.click(screen.getAllByTitle("Remove Member")[0]);
    expect(window.confirm).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(removeGroupMember).toHaveBeenCalledWith("grp1", "u2");
    });
  });

  // --- Negative Path Tests ---

  // Confirms member removal is aborted if the user clicks Cancel on the confirmation prompt
  it("aborts member removal when confirmation is cancelled", () => {
    const { removeGroupMember } = require("@/app/actions/groups");
    window.confirm = jest.fn(() => false);
    
    render(<GroupMembersList members={mockMembers} isOwner={true} groupId="grp1" />);
    fireEvent.click(screen.getByText("Members (3)"));
    
    fireEvent.click(screen.getAllByTitle("Remove Member")[0]);
    expect(removeGroupMember).not.toHaveBeenCalled();
  });

  // Confirms an alert is shown when the remove member server action fails
  it("alerts when member removal fails on the server", async () => {
    const { removeGroupMember } = require("@/app/actions/groups");
    removeGroupMember.mockResolvedValue({ success: false, error: "Cannot remove member" });

    render(<GroupMembersList members={mockMembers} isOwner={true} groupId="grp1" />);
    fireEvent.click(screen.getByText("Members (3)"));
    
    fireEvent.click(screen.getAllByTitle("Remove Member")[0]);
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Cannot remove member");
    });
  });
});