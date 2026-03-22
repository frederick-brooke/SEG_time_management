import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CreateGroup from "@/components/groups/CreateGroup";

// mocks
jest.mock("@/app/actions/groups", () => ({
  createGroup: jest.fn(),
  getMyFriendsForGroup: jest.fn().mockResolvedValue([
    { id: "f1", username: "bob", fname: "Bob", lname: "Jones", pfp: null },
    { id: "f2", username: "carol", fname: "Carol", lname: "White", pfp: null },
  ]),
}));

jest.mock("lucide-react", () => ({
  X: () => <svg data-testid="x-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  Check: () => <svg data-testid="check-icon" />,
}));

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

describe("CreateGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Verifies that the modal successfully transitions from its "loading" state 
   * to displaying the actual form fields once the mock API resolves.
   */
  it("renders the create group form after loading friends", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Study Squad/i)).toBeInTheDocument();
    });
  });

  /**
   * Ensures that the friend data returned from the server action is properly 
   * mapped and rendered into selectable buttons in the UI.
   */
  it("loads and displays friends in the picker", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => {
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
      expect(screen.getByText("Carol White")).toBeInTheDocument();
    });
  });

  /**
   * Verifies that the user can abort the creation process and that the 
   * parent component is notified to unmount the modal.
   */
  it("calls onClose when Cancel is clicked", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  /**
   * Tests client-side form validation. A group needs members, so this 
   * ensures the form cannot be submitted if the selected friends set is empty.
   */
  it("shows error when no friends are selected on submit", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByPlaceholderText(/Study Squad/i));
    fireEvent.change(screen.getByPlaceholderText(/Study Squad/i), {
      target: { value: "My Group" },
    });
    fireEvent.click(screen.getByText("Create Group"));
    await waitFor(() => {
      expect(screen.getByText("Select at least one friend to add to the group")).toBeInTheDocument();
    });
  });

  /**
   * Tests client-side form validation. Ensures the user is forced to provide 
   * a name before the server action is triggered.
   */
  it("shows error when group name is empty on submit", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Bob Jones"));
    fireEvent.click(screen.getByText("Bob Jones"));
    fireEvent.click(screen.getByText("Create Group"));
    await waitFor(() => {
      expect(screen.getByText("Group name is required")).toBeInTheDocument();
    });
  });

  /**
   * Verifies the interactive state of the friend picker. Clicking a friend 
   * should add them to the selection set (showing the count indicator), and 
   * clicking again should remove them.
   */
  it("toggles friend selection when clicked", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Bob Jones"));
    const bobButton = screen.getByText("Bob Jones").closest("button")!;
    fireEvent.click(bobButton);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(bobButton);
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
  });

  /**
   * THE HAPPY PATH: Verifies that when all fields are filled out correctly, 
   * the server action is called with the expected payload, and the success/close 
   * callbacks are fired.
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
    fireEvent.click(screen.getByText("Create Group"));

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
   * Tests server-side error handling. If the backend rejects the creation 
   * (e.g., database error), the error message should be displayed to the user.
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
    fireEvent.click(screen.getByText("Create Group"));

    await waitFor(() => {
      expect(screen.getByText("Group name is required")).toBeInTheDocument();
    });
  });

  /**
   * Verifies the edge case where a user tries to create a group but hasn't 
   * added any friends on the platform yet. It should guide them to add friends first.
   */
  it("shows empty state when user has no friends", async () => {
    const { getMyFriendsForGroup } = require("@/app/actions/groups");
    getMyFriendsForGroup.mockResolvedValue([]);

    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => {
      expect(screen.getByText(/No friends yet/)).toBeInTheDocument();
    });
  });
});