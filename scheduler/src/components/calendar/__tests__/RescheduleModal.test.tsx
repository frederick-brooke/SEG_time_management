import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RescheduleModal from "../RescheduleModal";

const baseTask = {
  id: "t1",
  title: "Write report",
  duration: 60,
  remainingDuration: 60,
  priority: "High",
  dueDate: null,
  eventId: null,
  relativeOffsetDays: null,
};

const weekStart = new Date(2030, 0, 7);  // Mon Jan 7
const weekEnd   = new Date(2030, 0, 12); // Sat Jan 12

const mockOnConfirm = jest.fn();
const mockOnDismiss = jest.fn();

function renderModal(overrides: Partial<React.ComponentProps<typeof RescheduleModal>> = {}) {
  return render(
    <RescheduleModal
      tasks={[baseTask]}
      weekStart={weekStart}
      weekEnd={weekEnd}
      onConfirm={mockOnConfirm}
      onDismiss={mockOnDismiss}
      {...overrides}
    />,
  );
}

beforeEach(() => jest.clearAllMocks());

// ── Header ────────────────────────────────────────────────────────────────────

describe("RescheduleModal — header", () => {
  it("renders the title", () => {
    renderModal();
    expect(screen.getByText("Reschedule Remaining")).toBeInTheDocument();
  });

  it("shows the date range in the subtitle", () => {
    renderModal();
    expect(screen.getByText(/Jan 7/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 12/)).toBeInTheDocument();
  });

  it("shows singular day when only 1 day remaining", () => {
    const sameDay = new Date(2030, 0, 7);
    renderModal({ weekStart: sameDay, weekEnd: sameDay });
    expect(screen.getByText(/1 day left/i)).toBeInTheDocument();
  });

  it("shows plural days when multiple days remaining", () => {
    renderModal();
    expect(screen.getByText(/days left/i)).toBeInTheDocument();
  });
});

// ── Summary strip ─────────────────────────────────────────────────────────────

describe("RescheduleModal — summary strip", () => {
  it("shows correct task count", () => {
    const tasks = [baseTask, { ...baseTask, id: "t2", title: "Another task" }];
    renderModal({ tasks });
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("tasks to carry over")).toBeInTheDocument();
  });

  it("shows correct remaining work in hours", () => {
    renderModal({ tasks: [{ ...baseTask, remainingDuration: 90 }] });
    expect(screen.getByText("1.5h")).toBeInTheDocument();
  });

  it("shows remaining work as 0h when no tasks selected", () => {
    renderModal({ tasks: [{ ...baseTask, remainingDuration: 60 }] });
    // deselect the task
    fireEvent.click(screen.getByText("Write report").closest("div[class*='rounded-2xl']")!);
    expect(screen.getByText("0h")).toBeInTheDocument();
  });

  it("shows correct days available", () => {
    renderModal();
    expect(screen.getByText("days available")).toBeInTheDocument();
  });

  it("rounds hours to 1 decimal place", () => {
    renderModal({ tasks: [{ ...baseTask, remainingDuration: 75 }] });
    expect(screen.getByText("1.3h")).toBeInTheDocument();
  });
});

// ── Task list ─────────────────────────────────────────────────────────────────

describe("RescheduleModal — task list", () => {
  it("renders all tasks", () => {
    const tasks = [
      baseTask,
      { ...baseTask, id: "t2", title: "Review PR" },
    ];
    renderModal({ tasks });
    expect(screen.getByText("Write report")).toBeInTheDocument();
    expect(screen.getByText("Review PR")).toBeInTheDocument();
  });

  it("shows all tasks as selected by default", () => {
    renderModal();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows remaining duration", () => {
    renderModal();
    expect(screen.getByText(/60m remaining/i)).toBeInTheDocument();
  });

  it("shows due date when present", () => {
    renderModal({ tasks: [{ ...baseTask, dueDate: "2030-01-15" }] });
    expect(screen.getByText(/Due Jan 15/i)).toBeInTheDocument();
  });

  it("does not show due date when absent", () => {
    renderModal();
    expect(screen.queryByText(/Due/i)).not.toBeInTheDocument();
  });

  it("shows High priority badge", () => {
    renderModal();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("shows Medium priority badge", () => {
    renderModal({ tasks: [{ ...baseTask, priority: "Medium" }] });
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("shows Low priority badge", () => {
    renderModal({ tasks: [{ ...baseTask, priority: "Low" }] });
    expect(screen.getByText("Low")).toBeInTheDocument();
  });
});

// ── Partial tasks ─────────────────────────────────────────────────────────────

describe("RescheduleModal — partial tasks", () => {
  const partialTask = { ...baseTask, duration: 60, remainingDuration: 30 };

  it("shows percentage done for partial tasks", () => {
    renderModal({ tasks: [partialTask] });
    expect(screen.getByText(/50% done/i)).toBeInTheDocument();
  });

  it("shows progress bar for partial tasks", () => {
    const { container } = renderModal({ tasks: [partialTask] });
    const bar = container.querySelector(".bg-amber-400");
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveStyle({ width: "50%" });
  });

  it("does not show percentage for tasks with no progress", () => {
    renderModal();
    expect(screen.queryByText(/%\s*done/i)).not.toBeInTheDocument();
  });

  it("does not show progress bar for non-partial tasks", () => {
    const { container } = renderModal();
    expect(container.querySelector(".bg-amber-400")).not.toBeInTheDocument();
  });

  it("handles 0 duration gracefully without showing progress", () => {
    renderModal({ tasks: [{ ...baseTask, duration: 0, remainingDuration: 0 }] });
    expect(screen.queryByText(/%\s*done/i)).not.toBeInTheDocument();
  });
});

// ── Selection ─────────────────────────────────────────────────────────────────

describe("RescheduleModal — selection", () => {
  it("deselects a task on click", () => {
    renderModal();
    fireEvent.click(screen.getByText("Write report").closest("div[class*='rounded-2xl']")!);
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });

  it("reselects a task on second click", () => {
    renderModal();
    const row = screen.getByText("Write report").closest("div[class*='rounded-2xl']")!;
    fireEvent.click(row);
    fireEvent.click(row);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("updates remaining work total when task is deselected", () => {
    const tasks = [
      { ...baseTask, id: "t1", remainingDuration: 60 },
      { ...baseTask, id: "t2", title: "Task 2", remainingDuration: 60 },
    ];
    renderModal({ tasks });
    fireEvent.click(screen.getByText("Write report").closest("div[class*='rounded-2xl']")!);
    expect(screen.getByText("1h")).toBeInTheDocument();
  });
});

// ── Footer button ─────────────────────────────────────────────────────────────

describe("RescheduleModal — footer button", () => {
  it("shows correct label with task count", () => {
    renderModal();
    expect(screen.getByText(/Reschedule 1 task into remaining week/i)).toBeInTheDocument();
  });

  it("uses plural when multiple tasks selected", () => {
    const tasks = [baseTask, { ...baseTask, id: "t2", title: "Task 2" }];
    renderModal({ tasks });
    expect(screen.getByText(/Reschedule 2 tasks into remaining week/i)).toBeInTheDocument();
  });

  it("shows No tasks selected when nothing is selected", () => {
    renderModal();
    fireEvent.click(screen.getByText("Write report").closest("div[class*='rounded-2xl']")!);
    expect(screen.getByText("No tasks selected")).toBeInTheDocument();
  });

  it("disables confirm button when no tasks selected", () => {
    renderModal();
    fireEvent.click(screen.getByText("Write report").closest("div[class*='rounded-2xl']")!);
    expect(screen.getByText("No tasks selected")).toBeDisabled();
  });

  it("calls onConfirm with selected task IDs", async () => {
    mockOnConfirm.mockResolvedValue(undefined);
    renderModal();
    fireEvent.click(screen.getByText(/Reschedule 1 task/i));
    expect(mockOnConfirm).toHaveBeenCalledWith(["t1"]);
  });

  it("only passes selected task IDs to onConfirm", async () => {
    mockOnConfirm.mockResolvedValue(undefined);
    const tasks = [baseTask, { ...baseTask, id: "t2", title: "Task 2" }];
    renderModal({ tasks });
    fireEvent.click(screen.getByText("Task 2").closest("div[class*='rounded-2xl']")!);
    fireEvent.click(screen.getByText(/Reschedule 1 task/i));
    expect(mockOnConfirm).toHaveBeenCalledWith(["t1"]);
  });

  it("shows Scheduling while saving", async () => {
    mockOnConfirm.mockImplementation(() => new Promise(() => {}));
    renderModal();
    fireEvent.click(screen.getByText(/Reschedule 1 task/i));
    expect(await screen.findByText("Scheduling…")).toBeInTheDocument();
  });

  it("disables button while saving", async () => {
    mockOnConfirm.mockImplementation(() => new Promise(() => {}));
    renderModal();
    fireEvent.click(screen.getByText(/Reschedule 1 task/i));
    expect(await screen.findByText("Scheduling…")).toBeDisabled();
  });

  it("re-enables button after saving completes", async () => {
    mockOnConfirm.mockResolvedValue(undefined);
    renderModal();
    fireEvent.click(screen.getByText(/Reschedule 1 task/i));
    await waitFor(() =>
      expect(screen.getByText(/Reschedule 1 task/i)).not.toBeDisabled(),
    );
  });
});