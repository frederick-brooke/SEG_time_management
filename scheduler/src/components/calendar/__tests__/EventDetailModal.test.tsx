/**
 * Tests for src/components/calendar/EventDetailModal.tsx
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EventDetailModal from "../EventDetailModal";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("date-fns", () => ({
  format: jest.fn(() => "Monday, June 3rd · 10:00 AM"),
}));

jest.mock("@/components/tasks/TaskForm", () => ({
  TaskForm: ({ onSubmit, onDelete }: any) => (
    <div data-testid="task-form">
      <button onClick={onSubmit}>Submit Task</button>
      <button onClick={onDelete}>Delete From Form</button>
    </div>
  ),
}));

jest.mock("@/src/components/calendar/EventForm", () => ({
  __esModule: true,
  default: ({ initialEvent, onSuccess }: any) => (
    <div data-testid="event-form">
      <span>{initialEvent ? "edit-mode" : "new-mode"}</span>
      <button onClick={onSuccess}>Event Success</button>
    </div>
  ),
}));

// ── Factory helpers ───────────────────────────────────────────────────────────

/**
 * Creates a mock calendar event.
 */
function createCalendarEvent(overrides: Record<string, any> = {}) {
  return {
    id: "event-1",
    title: "Team Meeting",
    start: new Date("2024-06-03T10:00:00Z"),
    end: new Date("2024-06-03T11:00:00Z"),
    category: "Lecture",
    description: "Weekly sync",
    _type: "event",
    isRecurring: false,
    recurrence: null,
    ...overrides,
  };
}

/**
 * Creates a mock task event.
 */
function createTaskEvent(overrides: Record<string, any> = {}) {
  return {
    id: "task-1",
    title: "Write Report",
    start: new Date("2024-06-03T10:00:00Z"),
    end: new Date("2024-06-03T11:00:00Z"),
    _type: "task",
    priority: "High",
    duration: 90,
    completed: false,
    isRecurring: false,
    recurrence: null,
    scheduledRelativeTo: null,
    relativeOffsetDays: null,
    eventId: null,
    ...overrides,
  };
}

/**
 * Default props for EventDetailModal.
 */
function createDefaultProps(overrides: Record<string, any> = {}) {
  return {
    selectedEvent: createCalendarEvent(),
    isEditing: false,
    isTaskEditOpen: false,
    taskFormData: {} as any,
    selectedDate: "2024-06-03",
    userId: "user-123",
    events: [],
    exams: [],
    onClose: jest.fn(),
    onSetEditing: jest.fn(),
    onSetTaskEdit: jest.fn(),
    onFormChange: jest.fn(),
    onTaskSubmit: jest.fn(),
    onDeleteTask: jest.fn(),
    onDeleteEvent: jest.fn(),
    onEventSuccess: jest.fn(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("EventDetailModal", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Modal behaviour ─────────────────────────────────────────────────────────

  describe("modal behaviour", () => {
    it("should call onClose when the backdrop is clicked", () => {
      const onClose = jest.fn();
      const { container } = render(
        <EventDetailModal {...createDefaultProps({ onClose })} />
      );
      fireEvent.click(container.firstChild as HTMLElement);
      expect(onClose).toHaveBeenCalled();
    });

    it("should not call onClose when clicking inside the modal card", () => {
      const onClose = jest.fn();
      render(<EventDetailModal {...createDefaultProps({ onClose })} />);
      fireEvent.click(screen.getByText("Team Meeting"));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("should call onClose when the ✕ button is clicked", () => {
      const onClose = jest.fn();
      render(<EventDetailModal {...createDefaultProps({ onClose })} />);
      fireEvent.click(screen.getByText("✕"));
      expect(onClose).toHaveBeenCalled();
    });
  });

  // ── Calendar event detail view ──────────────────────────────────────────────

  describe("calendar event detail view", () => {
    it("should render the event title", () => {
      render(<EventDetailModal {...createDefaultProps()} />);
      expect(screen.getByText("Team Meeting")).toBeInTheDocument();
    });

    it("should render the formatted event date", () => {
      render(<EventDetailModal {...createDefaultProps()} />);
      expect(screen.getByText("Monday, June 3rd · 10:00 AM")).toBeInTheDocument();
    });

    it("should render the event description when present", () => {
      render(<EventDetailModal {...createDefaultProps()} />);
      expect(screen.getByText("Weekly sync")).toBeInTheDocument();
    });

    it("should not render description section when description is absent", () => {
      const event = createCalendarEvent({ description: "" });
      render(<EventDetailModal {...createDefaultProps({ selectedEvent: event })} />);
      expect(screen.queryByText("Weekly sync")).not.toBeInTheDocument();
    });

    it("should render Edit Event button for a calendar event", () => {
      render(<EventDetailModal {...createDefaultProps()} />);
      expect(screen.getByText("Edit Event")).toBeInTheDocument();
    });

    it("should call onSetEditing(true) when Edit Event is clicked", () => {
      const onSetEditing = jest.fn();
      render(<EventDetailModal {...createDefaultProps({ onSetEditing })} />);
      fireEvent.click(screen.getByText("Edit Event"));
      expect(onSetEditing).toHaveBeenCalledWith(true);
    });

    it("should show a single Delete Event button for non-recurring events", () => {
      render(<EventDetailModal {...createDefaultProps()} />);
      expect(screen.getByText("Delete Event")).toBeInTheDocument();
      expect(screen.queryByText("Delete Only This Instance")).not.toBeInTheDocument();
      expect(screen.queryByText("Delete Entire Series")).not.toBeInTheDocument();
    });

    it("should call onDeleteEvent('series') when Delete Event is clicked on a non-recurring event", () => {
      const onDeleteEvent = jest.fn();
      render(<EventDetailModal {...createDefaultProps({ onDeleteEvent })} />);
      fireEvent.click(screen.getByText("Delete Event"));
      expect(onDeleteEvent).toHaveBeenCalledWith("series");
    });

    it("should show recurring series badge for recurring events", () => {
      const event = createCalendarEvent({ isRecurring: true });
      render(<EventDetailModal {...createDefaultProps({ selectedEvent: event })} />);
      expect(screen.getByText("Recurring series")).toBeInTheDocument();
    });

    it("should show single and series delete buttons for recurring events", () => {
      const event = createCalendarEvent({ isRecurring: true });
      render(<EventDetailModal {...createDefaultProps({ selectedEvent: event })} />);
      expect(screen.getByText("Delete Only This Instance")).toBeInTheDocument();
      expect(screen.getByText("Delete Entire Series")).toBeInTheDocument();
    });

    it("should call onDeleteEvent('single') when Delete Only This Instance is clicked", () => {
      const onDeleteEvent = jest.fn();
      const event = createCalendarEvent({ isRecurring: true });
      render(
        <EventDetailModal {...createDefaultProps({ selectedEvent: event, onDeleteEvent })} />
      );
      fireEvent.click(screen.getByText("Delete Only This Instance"));
      expect(onDeleteEvent).toHaveBeenCalledWith("single");
    });

    it("should call onDeleteEvent('series') when Delete Entire Series is clicked", () => {
      const onDeleteEvent = jest.fn();
      const event = createCalendarEvent({ isRecurring: true });
      render(
        <EventDetailModal {...createDefaultProps({ selectedEvent: event, onDeleteEvent })} />
      );
      fireEvent.click(screen.getByText("Delete Entire Series"));
      expect(onDeleteEvent).toHaveBeenCalledWith("series");
    });

    it("should show recurring delete buttons when recurrence type is set (not 'none')", () => {
      const event = createCalendarEvent({
        recurrence: { type: "weekly" },
        isRecurring: false,
      });
      render(<EventDetailModal {...createDefaultProps({ selectedEvent: event })} />);
      expect(screen.getByText("Delete Only This Instance")).toBeInTheDocument();
    });
  });

  // ── Task detail view ────────────────────────────────────────────────────────

  describe("task detail view", () => {
    it("should render the TASK badge for task events", () => {
      render(
        <EventDetailModal
          {...createDefaultProps({ selectedEvent: createTaskEvent() })}
        />
      );
      expect(screen.getByText("TASK")).toBeInTheDocument();
    });

    it("should render the task title", () => {
      render(
        <EventDetailModal
          {...createDefaultProps({ selectedEvent: createTaskEvent() })}
        />
      );
      expect(screen.getByText("Write Report")).toBeInTheDocument();
    });

    it("should render the task duration", () => {
      render(
        <EventDetailModal
          {...createDefaultProps({ selectedEvent: createTaskEvent({ duration: 90 }) })}
        />
      );
      expect(screen.getByText("90 mins")).toBeInTheDocument();
    });

    it("should render the task priority", () => {
      render(
        <EventDetailModal
          {...createDefaultProps({ selectedEvent: createTaskEvent({ priority: "High" }) })}
        />
      );
      expect(screen.getByText("High priority")).toBeInTheDocument();
    });

    it("should render the completed badge when task is completed", () => {
      render(
        <EventDetailModal
          {...createDefaultProps({ selectedEvent: createTaskEvent({ completed: true }) })}
        />
      );
      expect(screen.getByText("✓ Completed")).toBeInTheDocument();
    });

    it("should not render the completed badge when task is not completed", () => {
      render(
        <EventDetailModal
          {...createDefaultProps({ selectedEvent: createTaskEvent({ completed: false }) })}
        />
      );
      expect(screen.queryByText("✓ Completed")).not.toBeInTheDocument();
    });

    it("should render the recurring badge for recurring tasks", () => {
      const task = createTaskEvent({
        isRecurring: true,
        recurrence: { type: "weekly" },
      });
      render(
        <EventDetailModal {...createDefaultProps({ selectedEvent: task })} />
      );
      expect(screen.getByText(/Recurring/)).toBeInTheDocument();
    });

    it("should show 'same day' for linked tasks with relativeOffsetDays === 0", () => {
      const task = createTaskEvent({
        scheduledRelativeTo: "event-1",
        relativeOffsetDays: 0,
      });
      render(
        <EventDetailModal {...createDefaultProps({ selectedEvent: task })} />
      );
      expect(screen.getByText(/same day/)).toBeInTheDocument();
    });

    it("should show correct label for tasks linked N days before", () => {
      const task = createTaskEvent({
        scheduledRelativeTo: "event-1",
        relativeOffsetDays: -3,
      });
      render(
        <EventDetailModal {...createDefaultProps({ selectedEvent: task })} />
      );
      expect(screen.getByText(/3 days before/)).toBeInTheDocument();
    });

    it("should show correct label for tasks linked N days after", () => {
      const task = createTaskEvent({
        scheduledRelativeTo: "event-1",
        relativeOffsetDays: 2,
      });
      render(
        <EventDetailModal {...createDefaultProps({ selectedEvent: task })} />
      );
      expect(screen.getByText(/2 days after/)).toBeInTheDocument();
    });

    it("should show singular 'day' for relativeOffsetDays of 1", () => {
      const task = createTaskEvent({
        scheduledRelativeTo: "event-1",
        relativeOffsetDays: 1,
      });
      render(
        <EventDetailModal {...createDefaultProps({ selectedEvent: task })} />
      );
      expect(screen.getByText(/1 day after/)).toBeInTheDocument();
    });

    it("should render Edit Task button", () => {
      render(
        <EventDetailModal
          {...createDefaultProps({ selectedEvent: createTaskEvent() })}
        />
      );
      expect(screen.getByText("Edit Task")).toBeInTheDocument();
    });

    it("should call onSetTaskEdit(true) when Edit Task is clicked", () => {
      const onSetTaskEdit = jest.fn();
      render(
        <EventDetailModal
          {...createDefaultProps({ selectedEvent: createTaskEvent(), onSetTaskEdit })}
        />
      );
      fireEvent.click(screen.getByText("Edit Task"));
      expect(onSetTaskEdit).toHaveBeenCalledWith(true);
    });

    it("should call onDeleteTask when Delete Task is clicked", () => {
      const onDeleteTask = jest.fn();
      render(
        <EventDetailModal
          {...createDefaultProps({ selectedEvent: createTaskEvent(), onDeleteTask })}
        />
      );
      fireEvent.click(screen.getByText("Delete Task"));
      expect(onDeleteTask).toHaveBeenCalled();
    });
  });

  // ── Task edit form ──────────────────────────────────────────────────────────

  describe("task edit form", () => {
    it("should render the TaskForm when isTaskEditOpen is true", () => {
      render(
        <EventDetailModal
          {...createDefaultProps({
            selectedEvent: createTaskEvent(),
            isTaskEditOpen: true,
          })}
        />
      );
      expect(screen.getByTestId("task-form")).toBeInTheDocument();
      expect(screen.getByText("Edit Task")).toBeInTheDocument();
    });

    it("should call onSetTaskEdit(false) when Back is clicked", () => {
      const onSetTaskEdit = jest.fn();
      render(
        <EventDetailModal
          {...createDefaultProps({
            selectedEvent: createTaskEvent(),
            isTaskEditOpen: true,
            onSetTaskEdit,
          })}
        />
      );
      fireEvent.click(screen.getByText("← Back"));
      expect(onSetTaskEdit).toHaveBeenCalledWith(false);
    });

    it("should pass the linked event title to TaskForm when eventId is set", () => {
      const events = [{ id: "ev-1", title: "Linked Event" }];
      const task = createTaskEvent({ eventId: "ev-1" });
      render(
        <EventDetailModal
          {...createDefaultProps({
            selectedEvent: task,
            isTaskEditOpen: true,
            events,
          })}
        />
      );
      expect(screen.getByTestId("task-form")).toBeInTheDocument();
    });
  });

  // ── New event form ──────────────────────────────────────────────────────────

  describe("new event form", () => {
    it("should render EventForm in new-mode when selectedEvent is null", () => {
      render(
        <EventDetailModal
          {...createDefaultProps({ selectedEvent: null })}
        />
      );
      expect(screen.getByText("New Schedule")).toBeInTheDocument();
      expect(screen.getByText("new-mode")).toBeInTheDocument();
    });

    it("should call onEventSuccess when EventForm succeeds in new mode", () => {
      const onEventSuccess = jest.fn();
      render(
        <EventDetailModal
          {...createDefaultProps({ selectedEvent: null, onEventSuccess })}
        />
      );
      fireEvent.click(screen.getByText("Event Success"));
      expect(onEventSuccess).toHaveBeenCalled();
    });
  });

  // ── Edit event form ─────────────────────────────────────────────────────────

  describe("edit event form", () => {
    it("should render EventForm in edit-mode when isEditing is true", () => {
      render(
        <EventDetailModal
          {...createDefaultProps({ isEditing: true })}
        />
      );
      expect(screen.getByText("Modify Event")).toBeInTheDocument();
      expect(screen.getByText("edit-mode")).toBeInTheDocument();
    });

    it("should call onEventSuccess when EventForm succeeds in edit mode", () => {
      const onEventSuccess = jest.fn();
      render(
        <EventDetailModal
          {...createDefaultProps({ isEditing: true, onEventSuccess })}
        />
      );
      fireEvent.click(screen.getByText("Event Success"));
      expect(onEventSuccess).toHaveBeenCalled();
    });
  });
});