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

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

// tests
describe("CreateGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the create group form after loading friends", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Study Squad/i)).toBeInTheDocument();
    });
  });

  it("loads and displays friends in the picker", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => {
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
      expect(screen.getByText("Carol White")).toBeInTheDocument();
    });
  });

  it("calls onClose when Cancel is clicked", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

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

  it("shows error when group name is empty on submit", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Bob Jones"));
    fireEvent.click(screen.getByText("Bob Jones"));
    fireEvent.click(screen.getByText("Create Group"));
    await waitFor(() => {
      expect(screen.getByText("Group name is required")).toBeInTheDocument();
    });
  });

  it("toggles friend selection when clicked", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Bob Jones"));
    const bobButton = screen.getByText("Bob Jones").closest("button")!;
    fireEvent.click(bobButton);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(bobButton);
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
  });

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

  it("shows empty state when user has no friends", async () => {
    const { getMyFriendsForGroup } = require("@/app/actions/groups");
    getMyFriendsForGroup.mockResolvedValue([]);

    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => {
      expect(screen.getByText(/No friends yet/)).toBeInTheDocument();
    });
  });
});
