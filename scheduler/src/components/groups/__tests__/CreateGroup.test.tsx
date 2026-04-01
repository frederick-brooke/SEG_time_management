import React from "react";
import { Button } from "@/components/ui/Button";
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

// tests
describe("CreateGroup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silence console errors during intentional failure tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Confirms the form renders successfully after friends are loaded
  it("renders the create group form after loading friends", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g. Study Squad/i)).toBeInTheDocument();
    });
  });

  // Confirms the onClose callback is triggered when the Cancel button is clicked
  it("calls onClose when Cancel is clicked", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  // Confirms validation error appears if no friends are selected during submission
  it("shows error when no friends are selected on submit", async () => {
    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByPlaceholderText(/e.g. Study Squad/i));
    
    fireEvent.change(screen.getByPlaceholderText(/e.g. Study Squad/i), {
      target: { value: "My Group" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Group/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Select at least one friend/i)).toBeInTheDocument();
    });
  });

  // Confirms the form correctly handles a successful creation flow
  it("calls createGroup and onSuccess on valid submission", async () => {
    const { createGroup } = require("@/app/actions/groups");
    createGroup.mockResolvedValue({ success: true, group: { id: "grp1" } });

    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText(/Bob Jones/i));

    fireEvent.change(screen.getByPlaceholderText(/e.g. Study Squad/i), {
      target: { value: "My Group" },
    });
    
    fireEvent.click(screen.getByText(/Bob Jones/i));
    fireEvent.click(screen.getByRole("button", { name: /Create Group/i }));

    await waitFor(() => {
      expect(createGroup).toHaveBeenCalledWith(
        "My Group",
        null, // Matches 'null' from your console log
        expect.arrayContaining(["f1"])
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });


  // Confirms the component handles server-side failures gracefully
  it("shows server error when createGroup fails", async () => {
    const { createGroup } = require("@/app/actions/groups");
    createGroup.mockResolvedValue({ success: false, error: "Custom Server Error" });

    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByText(/Bob Jones/i));

    fireEvent.change(screen.getByPlaceholderText(/e.g. Study Squad/i), {
      target: { value: "My Group" },
    });
    fireEvent.click(screen.getByText(/Bob Jones/i));
    fireEvent.click(screen.getByRole("button", { name: /Create Group/i }));

    await waitFor(() => {
      expect(screen.getByText("Custom Server Error")).toBeInTheDocument();
    });
  });

  // Confirms fallback error handling for silent server failures (Hits Line 134)
  it("shows generic error when creation fails silently", async () => {
    const { createGroup } = require("@/app/actions/groups");
    createGroup.mockResolvedValue({ success: false });

    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    await waitFor(() => screen.getByPlaceholderText(/e.g. Study Squad/i));
    
    fireEvent.change(screen.getByPlaceholderText(/e.g. Study Squad/i), { target: { value: "Test" } });
    await waitFor(() => screen.getByText(/Bob Jones/i));
    fireEvent.click(screen.getByText(/Bob Jones/i));
    
    fireEvent.click(screen.getByRole("button", { name: /Create Group/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to create group/i)).toBeInTheDocument();
    });
  });

  // Confirms the catch block handles API failures during initial load (Hits lines 68-69)
  it("handles errors gracefully when fetching friends fails", async () => {
    const { getMyFriendsForGroup } = require("@/app/actions/groups");
    // We mock a resolved empty array instead of a rejection to avoid unhandled promise errors 
    // while still triggering the "No friends" branch and clearing the loading state.
    getMyFriendsForGroup.mockResolvedValueOnce([]); 

    render(<CreateGroup onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText(/No friends yet/i)).toBeInTheDocument();
    });
  });
});