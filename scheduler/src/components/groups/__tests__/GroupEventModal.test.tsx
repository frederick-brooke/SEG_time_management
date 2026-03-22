import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupEventModal from "@/components/groups/GroupEventModal";

// mocks
jest.mock("@/app/actions/groups", () => ({
  createGroupEvent: jest.fn().mockResolvedValue({ success: true }),
  updateGroupEvent: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("lucide-react", () => ({
  X: () => <svg data-testid="x-icon" />,
  MapPin: () => <svg data-testid="map-pin-icon" />,
}));

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

describe("GroupEventModal — create mode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    render(
      <GroupEventModal
        groupId="grp1"
        editingEvent={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  });

  /** Verifies the UI adapts correctly when the modal is in "Create" mode (no editingEvent prop). */
  it("renders the create heading", () => {
    expect(screen.getByText("Create Group Event")).toBeInTheDocument();
  });

  /** Ensures the constant list of event categories is mapped to buttons successfully. */
  it("renders all category options", () => {
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.getByText("Study")).toBeInTheDocument();
    expect(screen.getByText("Exam")).toBeInTheDocument();
  });

  /** Verifies the modal can be dismissed without saving changes. */
  it("closes when Cancel is clicked", () => {
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  /** * Tests date/time validation logic. It combines the HTML date and time inputs 
   * into JS Date objects and ensures the app prevents users from creating 
   * impossible events (e.g., an event that ends before it begins).
   */
  it("shows validation error when end is before start", async () => {
    fireEvent.change(screen.getByPlaceholderText(/Group Study/i), {
      target: { value: "Test Event" },
    });
    const dateInputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    const timeInputs = document.querySelectorAll<HTMLInputElement>('input[type="time"]');
    
    // Set End time (09:00) to be before Start time (10:00)
    fireEvent.change(dateInputs[0], { target: { value: "2026-03-15" } });
    fireEvent.change(timeInputs[0], { target: { value: "10:00" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-03-15" } });
    fireEvent.change(timeInputs[1], { target: { value: "09:00" } });
    
    await act(async () => { fireEvent.click(screen.getByText("Create Event")); });
    await waitFor(() => {
      expect(screen.getByText("End time must be after start time")).toBeInTheDocument();
    });
  });

  /**
   * THE HAPPY PATH (CREATE): Simulates filling out the entire form properly and 
   * checks if the `createGroupEvent` server action is called with the exact shape 
   * of data the backend expects.
   */
  it("calls createGroupEvent with correct data on valid submit", async () => {
    const { createGroupEvent } = require("@/app/actions/groups");
    fireEvent.change(screen.getByPlaceholderText(/Group Study/i), {
      target: { value: "Movie Night" },
    });
    const dateInputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    const timeInputs = document.querySelectorAll<HTMLInputElement>('input[type="time"]');
    
    fireEvent.change(dateInputs[0], { target: { value: "2026-03-15" } });
    fireEvent.change(timeInputs[0], { target: { value: "18:00" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-03-15" } });
    fireEvent.change(timeInputs[1], { target: { value: "21:00" } });
    
    await act(async () => { fireEvent.click(screen.getByText("Create Event")); });
    await waitFor(() => {
      expect(createGroupEvent).toHaveBeenCalledWith(
        "grp1",
        expect.objectContaining({ title: "Movie Night", category: "Social" })
      );
    });
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  /** * Verifies that the internal component state updates when clicking category pills, 
   * applying the active Lunar theme CSS class to the selected option.
   */
  it("changes selected category when clicked", () => {
    fireEvent.click(screen.getByText("Study"));
    expect(screen.getByText("Study")).toHaveClass("border-blue-500/50");
  });
});

describe("GroupEventModal — edit mode", () => {
  const editingEvent = {
    groupEventGroupId: "gevt-1",
    title: "Old Meeting",
    description: "Old description",
    start: new Date("2026-03-15T09:00:00.000Z"),
    end: new Date("2026-03-15T10:00:00.000Z"),
    category: "Social",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    render(
      <GroupEventModal
        groupId="grp1"
        editingEvent={editingEvent} // Passing an event puts modal in Edit Mode
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  });

  /** Verifies the UI adapts correctly when the modal is in "Edit" mode. */
  it("renders the edit heading", () => {
    expect(screen.getByText("Edit Group Event")).toBeInTheDocument();
  });

  /** * Crucial test to ensure that the `editingEvent` prop successfully parses the 
   * date objects and populates the text/date/time inputs correctly on mount.
   */
  it("pre-fills the title with the existing event title", () => {
    expect(screen.getByDisplayValue("Old Meeting")).toBeInTheDocument();
  });

  /**
   * THE HAPPY PATH (EDIT): Ensures that modifying an existing event triggers 
   * the `updateGroupEvent` server action (instead of create) and passes the 
   * specific `groupEventGroupId` so all group members' copies are updated.
   */
  it("calls updateGroupEvent on submit", async () => {
    const { updateGroupEvent } = require("@/app/actions/groups");
    await act(async () => { fireEvent.click(screen.getByText("Save Changes")); });
    await waitFor(() => {
      expect(updateGroupEvent).toHaveBeenCalledWith(
        "gevt-1",
        "grp1",
        expect.objectContaining({ title: "Old Meeting" })
      );
    });
  });
});