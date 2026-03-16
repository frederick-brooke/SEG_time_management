import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModuleEventModal from "@/components/modules/ModuleEventModal";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/app/actions/module", () => ({
  createModuleEvent: jest.fn().mockResolvedValue({ success: true }),
  updateModuleEvent: jest.fn().mockResolvedValue({ success: true }),
}));

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

// ─── Tests ────────────────────────────────────────────────────────────────────

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

  it("renders the create heading", () => {
    expect(screen.getByText("Create Module Event")).toBeInTheDocument();
  });

  it("renders all category options", () => {
    expect(screen.getByText("Lecture")).toBeInTheDocument();
    expect(screen.getByText("Exam")).toBeInTheDocument();
    expect(screen.getByText("Lab")).toBeInTheDocument();
  });

  it("closes when the X button is clicked", () => {
    fireEvent.click(screen.getByRole("button", { name: "" }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows validation error when end is before start", async () => {
    fireEvent.change(screen.getByPlaceholderText(/Midterm Exam/i), {
      target: { value: "Test Event" },
    });
    const dateInputs = screen.getAllByDisplayValue("");
    fireEvent.change(dateInputs[0], { target: { value: "2026-03-15" } });
    fireEvent.change(dateInputs[1], { target: { value: "10:00" } });
    fireEvent.change(dateInputs[2], { target: { value: "2026-03-15" } });
    fireEvent.change(dateInputs[3], { target: { value: "09:00" } });
    fireEvent.click(screen.getByText("Create Event"));
    await waitFor(() => {
      expect(screen.getByText("End time must be after start time")).toBeInTheDocument();
    });
  });

  it("calls createModuleEvent with correct data on valid submit", async () => {
    const { createModuleEvent } = require("@/app/actions/module");
    fireEvent.change(screen.getByPlaceholderText(/Midterm Exam/i), {
      target: { value: "Guest Lecture" },
    });
    const dateInputs = screen.getAllByDisplayValue("");
    fireEvent.change(dateInputs[0], { target: { value: "2026-03-15" } });
    fireEvent.change(dateInputs[1], { target: { value: "09:00" } });
    fireEvent.change(dateInputs[2], { target: { value: "2026-03-15" } });
    fireEvent.change(dateInputs[3], { target: { value: "10:00" } });
    fireEvent.click(screen.getByText("Create Event"));
    await waitFor(() => {
      expect(createModuleEvent).toHaveBeenCalledWith(
        "mod1",
        expect.objectContaining({ title: "Guest Lecture", category: "Lecture" })
      );
    });
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("changes selected category when one is clicked", () => {
    fireEvent.click(screen.getByText("Exam"));
    expect(screen.getByText("Exam")).toHaveClass("border-blue-600");
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
        editingEvent={editingEvent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  });

  it("renders the edit heading", () => {
    expect(screen.getByText("Edit Module Event")).toBeInTheDocument();
  });

  it("pre-fills the title with the existing event title", () => {
    expect(screen.getByDisplayValue("Old Lecture")).toBeInTheDocument();
  });

  it("calls updateModuleEvent on submit", async () => {
    const { updateModuleEvent } = require("@/app/actions/module");
    fireEvent.click(screen.getByText("Save Changes"));
    await waitFor(() => {
      expect(updateModuleEvent).toHaveBeenCalledWith(
        "grp-ev1",
        "mod1",
        expect.objectContaining({ title: "Old Lecture" })
      );
    });
  });
});
