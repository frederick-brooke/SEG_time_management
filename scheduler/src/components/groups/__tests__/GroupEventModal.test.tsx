//tests for scheduler/src/components/groups/GroupEventModal.tsx
import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupEventModal from "@/components/groups/GroupEventModal";

// mocks
jest.mock("@/app/actions/groups", () => ({
  createGroupEvent: jest.fn().mockResolvedValue({ success: true }),
  updateGroupEvent: jest.fn().mockResolvedValue({ success: true }),
}));

// All icons used by GroupEventModal and any sibling components rendered in the
// same Jest worker must be listed here — an incomplete mock resolves to undefined
// and causes "Element type is invalid" errors across the entire test suite.
jest.mock("lucide-react", () => ({
  X:        () => <svg data-testid="x-icon" />,
  MapPin:   () => <svg data-testid="map-pin-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  Pencil:   () => <svg data-testid="pencil-icon" />,
  Trash2:   () => <svg data-testid="trash-icon" />,
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

  // Confirms the UI adapts correctly when the modal is in "Create" mode
  it("renders the create heading", () => {
    expect(screen.getByText("Create Group Event")).toBeInTheDocument();
  });

  // Confirms the constant list of event categories is mapped to buttons successfully
  it("renders all category options", () => {
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.getByText("Study")).toBeInTheDocument();
    expect(screen.getByText("Exam")).toBeInTheDocument();
  });

  // Confirms the modal can be dismissed without saving changes
  it("closes when Cancel is clicked", () => {
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  // Confirms date/time validation prevents users from creating impossible events
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

  // Confirms createGroupEvent is called with the correct data shape on valid submit
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

  // Confirms the internal state updates when clicking category pills
  it("changes selected category when clicked", () => {
    fireEvent.click(screen.getByText("Study"));
    expect(screen.getByText("Study")).toHaveClass("border-blue-500/50");
  });
});

describe("GroupEventModal — edit mode", () => {
  const editingEvent = {
    groupEventGroupId: "gevt-1",
    title:             "Old Meeting",
    description:       "Old description",
    start:             new Date("2026-03-15T09:00:00.000Z"),
    end:               new Date("2026-03-15T10:00:00.000Z"),
    category:          "Social",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    render(
      <GroupEventModal
        groupId="grp1"
        editingEvent={editingEvent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  });

  // Confirms the UI adapts correctly when the modal is in "Edit" mode
  it("renders the edit heading", () => {
    expect(screen.getByText("Edit Group Event")).toBeInTheDocument();
  });

  // Confirms that the editingEvent prop populates the inputs correctly on mount
  it("pre-fills the title with the existing event title", () => {
    expect(screen.getByDisplayValue("Old Meeting")).toBeInTheDocument();
  });

  // Confirms modifying an existing event triggers updateGroupEvent instead of create
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