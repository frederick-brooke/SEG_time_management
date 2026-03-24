import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModuleEventModal from "@/components/modules/ModuleEventModal";

//mocks

jest.mock("@/app/actions/module", () => ({
  createModuleEvent: jest.fn().mockResolvedValue({ success: true }),
  updateModuleEvent: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock lucide icons to avoid SVG rendering issues and make button targeting easier
jest.mock("lucide-react", () => ({
  X: () => <svg data-testid="x-icon" />,
  MapPin: () => <svg data-testid="map-pin-icon" />
}));

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

//tests

describe("ModuleEventModal — create mode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    render(
      <ModuleEventModal
        moduleId="mod1"
        editingEvent={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  });

  /**
   * Verifies that the modal opens in Create Mode with the correct title.
   */
  it("renders the create heading", () => {
    expect(screen.getByText("Create Module Event")).toBeInTheDocument();
  });

  /**
   * Ensures all event categories are rendered as selectable options.
   */
  it("renders all category options", () => {
    expect(screen.getByText("Lecture")).toBeInTheDocument();
    expect(screen.getByText("Exam")).toBeInTheDocument();
    expect(screen.getByText("Lab")).toBeInTheDocument();
  });

  /**
   * Verifies the close button triggers the onClose callback.
   */
  it("closes when the X button is clicked", () => {
    // Find the button wrapping the X icon reliably
    const closeBtn = screen.getByTestId("x-icon").closest("button")!;
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  /**
   * Tests client-side validation logic: Ensures users cannot create an event
   * where the end time chronologically precedes the start time.
   */
  it("shows validation error when end is before start", async () => {
    // Fill out required title
    fireEvent.change(screen.getByPlaceholderText(/Midterm Exam/i), {
      target: { value: "Test Event" },
    });

    // Grab date and time inputs reliably
    const dateFields = document.querySelectorAll('input[type="date"]');
    const timeFields = document.querySelectorAll('input[type="time"]');

    // Set matching dates
    fireEvent.change(dateFields[0], { target: { value: "2026-03-15" } });
    fireEvent.change(dateFields[1], { target: { value: "2026-03-15" } });

    // Set End Time (09:00) BEFORE Start Time (10:00)
    fireEvent.change(timeFields[0], { target: { value: "10:00" } });
    fireEvent.change(timeFields[1], { target: { value: "09:00" } });

    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    await waitFor(() => {
      expect(screen.getByText("End time must be after start time")).toBeInTheDocument();
    });
  });

  /**
   * THE HAPPY PATH: Verifies that filling out the form correctly triggers
   * the server action with the right payload, and closes the modal.
   */
  it("calls createModuleEvent with correct data on valid submit", async () => {
    const { createModuleEvent } = require("@/app/actions/module");
    
    // Fill out required title
    fireEvent.change(screen.getByPlaceholderText(/Midterm Exam/i), {
      target: { value: "Guest Lecture" },
    });

    // Grab date and time inputs reliably
    const dateFields = document.querySelectorAll('input[type="date"]');
    const timeFields = document.querySelectorAll('input[type="time"]');

    // Set valid dates and times
    fireEvent.change(dateFields[0], { target: { value: "2026-03-15" } });
    fireEvent.change(dateFields[1], { target: { value: "2026-03-15" } });
    fireEvent.change(timeFields[0], { target: { value: "09:00" } });
    fireEvent.change(timeFields[1], { target: { value: "10:00" } }); // Valid!

    fireEvent.click(screen.getByRole("button", { name: /Create Event/i }));

    await waitFor(() => {
      expect(createModuleEvent).toHaveBeenCalledWith(
        "mod1",
        expect.objectContaining({ title: "Guest Lecture", category: "Lecture" })
      );
    });
    
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  /**
   * UI interaction test: Verifies that clicking a category updates its active CSS class.
   */
  it("changes selected category when one is clicked", () => {
    fireEvent.click(screen.getByText("Exam"));
    
    // Updated to match the Lunar theme active class
    expect(screen.getByText("Exam")).toHaveClass("border-blue-500");
  });
});

describe("ModuleEventModal — edit mode", () => {
  const editingEvent = {
    moduleEventGroupId: "grp-ev1",
    title: "Old Lecture",
    description: "Old description",
    start: new Date("2026-03-15T09:00:00.000Z"),
    end: new Date("2026-03-15T10:00:00.000Z"),
    category: "Lecture",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    render(
      <ModuleEventModal
        moduleId="mod1"
        editingEvent={editingEvent as any} // Cast as any to bypass strict type matching in tests
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  });

  /**
   * Verifies the modal adapts its UI for editing an existing event.
   */
  it("renders the edit heading", () => {
    expect(screen.getByText("Edit Module Event")).toBeInTheDocument();
  });

  /**
   * Ensures the form accurately hydrates its state from the passed-in event prop.
   */
  it("pre-fills the title with the existing event title", () => {
    expect(screen.getByDisplayValue("Old Lecture")).toBeInTheDocument();
  });

  /**
   * Verifies that submitting an edited form correctly targets the update
   * action with the specific moduleEventGroupId.
   */
  it("calls updateModuleEvent on submit", async () => {
    const { updateModuleEvent } = require("@/app/actions/module");
    
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    
    await waitFor(() => {
      expect(updateModuleEvent).toHaveBeenCalledWith(
        "grp-ev1",
        "mod1",
        expect.objectContaining({ title: "Old Lecture" })
      );
    });
  });
});