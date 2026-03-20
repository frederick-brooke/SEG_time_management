import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupEventModal from "@/components/groups/GroupEventModal";

// mocks
jest.mock("@/app/actions/groups", () => ({
  createGroupEvent: jest.fn().mockResolvedValue({ success: true }),
  updateGroupEvent: jest.fn().mockResolvedValue({ success: true }),
}));

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

// tests
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

  it("renders the create heading", () => {
    expect(screen.getByText("Create Group Event")).toBeInTheDocument();
  });

  it("renders all category options", () => {
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.getByText("Study")).toBeInTheDocument();
    expect(screen.getByText("Exam")).toBeInTheDocument();
  });

  it("closes when Cancel is clicked", () => {
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows validation error when end is before start", async () => {
    fireEvent.change(screen.getByPlaceholderText(/Group Study/i), {
      target: { value: "Test Event" },
    });
    const dateInputs = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    const timeInputs = document.querySelectorAll<HTMLInputElement>('input[type="time"]');
    fireEvent.change(dateInputs[0], { target: { value: "2026-03-15" } });
    fireEvent.change(timeInputs[0], { target: { value: "10:00" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-03-15" } });
    fireEvent.change(timeInputs[1], { target: { value: "09:00" } });
    await act(async () => { fireEvent.click(screen.getByText("Create Event")); });
    await waitFor(() => {
      expect(screen.getByText("End time must be after start time")).toBeInTheDocument();
    });
  });

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

  it("changes selected category when clicked", () => {
    fireEvent.click(screen.getByText("Study"));
    expect(screen.getByText("Study")).toHaveClass("border-purple-600");
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
        editingEvent={editingEvent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  });

  it("renders the edit heading", () => {
    expect(screen.getByText("Edit Group Event")).toBeInTheDocument();
  });

  it("pre-fills the title with the existing event title", () => {
    expect(screen.getByDisplayValue("Old Meeting")).toBeInTheDocument();
  });

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
