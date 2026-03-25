import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CreateGroup from "@/components/groups/CreateGroup";

//mocks

jest.mock("@/app/actions/groups", () => ({
  createGroup: jest.fn(),
  getMyFriendsForGroup: jest.fn().mockResolvedValue([
    { id: "f1", username: "bob", fname: "Bob", lname: "Jones", pfp: null },
    { id: "f2", username: "carol", fname: "Carol", lname: "White", pfp: null },
  ]),
}));

// Mock lucide icons to avoid SVG rendering issues in JSDOM
jest.mock("lucide-react", () => ({
  X: () => <svg data-testid="x-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  Check: () => <svg data-testid="check-icon" />,
}));

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

//tests

describe("CreateGroup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Verifies the initial rendering state of the component, ensuring the form 
   * displays properly once the asynchronous friend loading completes.
   */
  it("renders the create group form after loading friends", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Study Squad/i)).toBeInTheDocument();
    });
  });

  /**
   * Ensures the mock data returned by `getMyFriendsForGroup` is correctly 
   * parsed and rendered as clickable options within the friend picker UI.
   */
  it("loads and displays friends in the picker", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => {
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
      expect(screen.getByText("Carol White")).toBeInTheDocument();
    });
  });

  /**
   * Validates that clicking the "Cancel" button correctly aborts the 
   * creation process and triggers the parent component's `onClose` callback.
   */
  it("calls onClose when Cancel is clicked", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Cancel"));
    
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  /**
   * Verifies client-side validation prevents form submission and displays an error 
   * if the user attempts to create a group without selecting at least one friend.
   */
  it("shows error when no friends are selected on submit", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByPlaceholderText(/Study Squad/i));
    
    fireEvent.change(screen.getByPlaceholderText(/Study Squad/i), {
      target: { value: "My Group" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Group/i }));
    
    await waitFor(() => {
      expect(screen.getByText("Select at least one friend to add to the group")).toBeInTheDocument();
    });
  });


  /**
   * Ensures the friend picker interactive states update correctly. Selecting and 
   * deselecting a user should accurately update the visual "selected" counter.
   */
  it("toggles friend selection when clicked", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Bob Jones"));
    
    const bobButton = screen.getByText("Bob Jones").closest("button")!;
    
    // Select Bob
    fireEvent.click(bobButton);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    
    // Deselect Bob
    fireEvent.click(bobButton);
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
  });

  /**
   * Verifies that providing valid inputs triggers the server action
   * with the correct payload array, and subsequently fires the success and close callbacks.
   */
  it("calls createGroup and onSuccess on valid submission", async () => {
    const { createGroup } = require("@/app/actions/groups");
    createGroup.mockResolvedValue({ success: true, group: { id: "grp1" } });

    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Bob Jones"));

    fireEvent.change(screen.getByPlaceholderText(/Study Squad/i), {
      target: { value: "My Group" },
    });
    fireEvent.click(screen.getByText("Bob Jones").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /Create Group/i }));

    await waitFor(() => {
      expect(createGroup).toHaveBeenCalledWith(
        "My Group",
        null,
        expect.arrayContaining(["f1"])
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  /**
   * Simulates a backend validation failure (e.g., database constraint) and ensures
   * the resulting server error message is correctly extracted and displayed to the user.
   */
  it("shows server error when createGroup fails", async () => {
    const { createGroup } = require("@/app/actions/groups");
    createGroup.mockResolvedValue({ success: false, error: "Group name is required" });

    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Bob Jones"));

    fireEvent.change(screen.getByPlaceholderText(/Study Squad/i), {
      target: { value: "My Group" },
    });
    fireEvent.click(screen.getByText("Bob Jones").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /Create Group/i }));

    await waitFor(() => {
      expect(screen.getByText("Group name is required")).toBeInTheDocument();
    });
  });

  /**
   * Verifies the fallback UI gracefully handles the scenario where the current
   * user has no accepted friends to invite to a new group.
   */
  it("shows empty state when user has no friends", async () => {
    const { getMyFriendsForGroup } = require("@/app/actions/groups");
    getMyFriendsForGroup.mockResolvedValue([]);

    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText(/No friends yet/i)).toBeInTheDocument();
    });
  });
});