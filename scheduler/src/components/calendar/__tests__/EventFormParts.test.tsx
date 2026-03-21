/**
 * Tests for src/components/calendar/EventFormParts.tsx
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  TaskPromptSection,
  LinkedTaskCard,
  RELATIVE_OPTIONS,
} from "../EventFormParts";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/components/shared/FormComponents", () => ({
  Toggle: ({ on, onToggle, label }: any) => (
    <div>
      <button onClick={onToggle} data-testid={`toggle-${label}`}>
        {label}
      </button>
      <span data-testid={`toggle-state-${label}`}>{on ? "on" : "off"}</span>
    </div>
  ),
  RecurrencePanel: ({ type, onType, onDays, onUntil }: any) => (
    <div data-testid="recurrence-panel">
      <select
        data-testid="rec-type"
        value={type}
        onChange={(e) => onType(e.target.value)}
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly (with event)</option>
        <option value="monthly">Monthly</option>
      </select>
    </div>
  ),
}));

jest.mock("@/lib/ui", () => ({
  PRIORITY_TEXT: {
    High: "text-red-400",
    Medium: "text-orange-400",
    Low: "text-green-400",
  },
}));

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a minimal mock task for LinkedTaskCard.
 */
function createMockTask(overrides: Record<string, any> = {}) {
  return {
    title: "Write Report",
    duration: 90,
    priority: "High",
    relativeMode: "1-before",
    scheduledRelativeTo: "before",
    relativeOffsetDays: -1,
    customDate: null,
    customRangeStart: null,
    customRangeEnd: null,
    useRange: false,
    isRecurring: false,
    recurrence: null,
    scheduleTime: false,
    specificTime: null,
    ...overrides,
  };
}

/**
 * Default props for TaskPromptSection.
 */
function createTaskPromptProps(overrides: Record<string, any> = {}) {
  return {
    createdEventId: "event-123",
    userId: "user-123",
    eventStartDate: "2024-06-03",
    defaultUntil: "2024-12-31",
    onFinish: jest.fn(),
    ...overrides,
  };
}

// ── RELATIVE_OPTIONS ──────────────────────────────────────────────────────────

describe("RELATIVE_OPTIONS", () => {
  it("should contain 8 options", () => {
    expect(RELATIVE_OPTIONS).toHaveLength(8);
  });

  it("should have correct offsetDays for 3-before", () => {
    const opt = RELATIVE_OPTIONS.find((o) => o.key === "3-before");
    expect(opt?.offsetDays).toBe(-3);
  });

  it("should have correct offsetDays for same-day", () => {
    const opt = RELATIVE_OPTIONS.find((o) => o.key === "same-day");
    expect(opt?.offsetDays).toBe(0);
  });

  it("should have correct offsetDays for 3-after", () => {
    const opt = RELATIVE_OPTIONS.find((o) => o.key === "3-after");
    expect(opt?.offsetDays).toBe(3);
  });

  it("should have null offsetDays for custom", () => {
    const opt = RELATIVE_OPTIONS.find((o) => o.key === "custom");
    expect(opt?.offsetDays).toBeNull();
  });

  it("should have a label for every option", () => {
    RELATIVE_OPTIONS.forEach((opt) => {
      expect(opt.label).toBeTruthy();
    });
  });
});

// ── TaskPromptSection ─────────────────────────────────────────────────────────

describe("TaskPromptSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  it("should render the prompt banner", () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);
    expect(screen.getByText("Link tasks to this event?")).toBeInTheDocument();
  });

  it("should render the NewTaskForm with Add Task button", () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);
    expect(screen.getByText("+ Add Task")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Task title")).toBeInTheDocument();
  });

  it("should show 'Skip — No Tasks' when no tasks have been added", () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);
    expect(screen.getByText("Skip — No Tasks")).toBeInTheDocument();
  });

  it("should call onFinish without fetching when Skip is clicked with no tasks", async () => {
    const onFinish = jest.fn();
    render(<TaskPromptSection {...createTaskPromptProps({ onFinish })} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Skip — No Tasks"));
    });
    expect(onFinish).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should show a LinkedTaskCard after adding a task", async () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);

    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Prepare slides" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));

    expect(screen.getByText("Prepare slides")).toBeInTheDocument();
  });

  it("should change the finish button label to 'Save Tasks & Finish' after adding a task", async () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);

    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Review notes" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));

    expect(screen.getByText("Save Tasks & Finish")).toBeInTheDocument();
  });

  it("should POST to /api/tasks and call onFinish when Save Tasks & Finish is clicked", async () => {
    const onFinish = jest.fn();
    render(<TaskPromptSection {...createTaskPromptProps({ onFinish })} />);

    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Review notes" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));

    await act(async () => {
      fireEvent.click(screen.getByText("Save Tasks & Finish"));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/tasks",
      expect.objectContaining({ method: "POST" })
    );
    expect(onFinish).toHaveBeenCalled();
  });

  it("should include userId and eventId in the POSTed tasks", async () => {
    render(
      <TaskPromptSection
        {...createTaskPromptProps({
          userId: "user-abc",
          createdEventId: "event-xyz",
        })}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task A" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));

    await act(async () => {
      fireEvent.click(screen.getByText("Save Tasks & Finish"));
    });

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    );
    expect(body.tasks[0].userId).toBe("user-abc");
    expect(body.tasks[0].eventId).toBe("event-xyz");
  });

  it("should dispatch a tasks-updated event after saving", async () => {
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");
    render(<TaskPromptSection {...createTaskPromptProps()} />);

    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task A" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));

    await act(async () => {
      fireEvent.click(screen.getByText("Save Tasks & Finish"));
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tasks-updated" })
    );
    dispatchSpy.mockRestore();
  });

  it("should remove a task when its remove button is clicked", async () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);

    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task to remove" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(screen.getByText("Task to remove")).toBeInTheDocument();

    fireEvent.click(screen.getByText("✕"));

    expect(screen.queryByText("Task to remove")).not.toBeInTheDocument();
    expect(screen.getByText("Skip — No Tasks")).toBeInTheDocument();
  });
});

// ── LinkedTaskCard ────────────────────────────────────────────────────────────

describe("LinkedTaskCard", () => {
  const defaultProps = {
    task: createMockTask(),
    index: 0,
    eventStartDate: "2024-06-03",
    onUpdate: jest.fn(),
    onRemove: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("should render the task title", () => {
    render(<LinkedTaskCard {...defaultProps} />);
    expect(screen.getByText("Write Report")).toBeInTheDocument();
  });

  it("should render the task duration", () => {
    render(<LinkedTaskCard {...defaultProps} />);
    expect(screen.getByText("90m")).toBeInTheDocument();
  });

  it("should render the task priority", () => {
    render(<LinkedTaskCard {...defaultProps} />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("should render the relative mode badge", () => {
    render(<LinkedTaskCard {...defaultProps} />);
    expect(screen.getByText("1 day before")).toBeInTheDocument();
  });

  it("should call onUpdate on mount via useEffect", () => {
    const onUpdate = jest.fn();
    render(<LinkedTaskCard {...defaultProps} onUpdate={onUpdate} />);
    expect(onUpdate).toHaveBeenCalledWith(0, expect.objectContaining({
      relativeMode: "1-before",
    }));
  });

  it("should call onRemove with the correct index when the remove button is clicked", () => {
    const onRemove = jest.fn();
    render(<LinkedTaskCard {...defaultProps} onRemove={onRemove} />);
    fireEvent.click(screen.getByText("✕"));
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it("should show the expand button and toggle detail panel", () => {
    render(<LinkedTaskCard {...defaultProps} />);

    expect(screen.getByText("▼")).toBeInTheDocument();
    expect(
      screen.queryByText("Schedule relative to event")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("▼"));

    expect(screen.getByText("Schedule relative to event")).toBeInTheDocument();
    expect(screen.getByText("▲")).toBeInTheDocument();
  });

  it("should show the relative picker options when expanded", () => {
    render(<LinkedTaskCard {...defaultProps} />);
    fireEvent.click(screen.getByText("▼"));
    expect(screen.getByText("Same day")).toBeInTheDocument();
    expect(screen.getByText("3 days before")).toBeInTheDocument();
  });

  it("should update the mode badge when a different relative option is selected", () => {
    render(<LinkedTaskCard {...defaultProps} />);
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Same day"));
  
    // "Same day" appears twice: once in the header badge and once as the active picker button
    const matches = screen.getAllByText("Same day");
    expect(matches).toHaveLength(2);
  });

  it("should show the schedule time toggle when expanded", () => {
    render(<LinkedTaskCard {...defaultProps} />);
    fireEvent.click(screen.getByText("▼"));
    expect(
      screen.getByTestId("toggle-Schedule for a specific time?")
    ).toBeInTheDocument();
  });

  it("should show the recurring toggle when expanded", () => {
    render(<LinkedTaskCard {...defaultProps} />);
    fireEvent.click(screen.getByText("▼"));
    expect(screen.getByTestId("toggle-One-time task")).toBeInTheDocument();
  });

  it("should show RecurrencePanel when isRecurring is toggled on", () => {
    render(<LinkedTaskCard {...defaultProps} />);
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByTestId("toggle-One-time task"));
    expect(screen.getByTestId("recurrence-panel")).toBeInTheDocument();
  });

  it("should show a time input when schedule time toggle is turned on", () => {
    render(<LinkedTaskCard {...defaultProps} />);
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByTestId("toggle-Schedule for a specific time?"));
    expect(screen.getByDisplayValue("09:00")).toBeInTheDocument();
  });

  it("should show CustomDatePicker when 'Custom date' option is selected", () => {
    render(<LinkedTaskCard {...defaultProps} />);
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Custom date"));
    expect(screen.getByText("Use a date range")).toBeInTheDocument();
  });
});

// ── NewTaskForm (via TaskPromptSection) ───────────────────────────────────────

describe("NewTaskForm", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should not add a task when the title is empty", () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(screen.queryByText("Save Tasks & Finish")).not.toBeInTheDocument();
  });

  it("should add a task and reset the title field on Add Task click", () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);

    const input = screen.getByPlaceholderText("Task title");
    fireEvent.change(input, { target: { value: "My Task" } });
    fireEvent.click(screen.getByText("+ Add Task"));

    expect(screen.getByText("My Task")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("should add a task when Enter is pressed in the title input", () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);

    const input = screen.getByPlaceholderText("Task title");
    fireEvent.change(input, { target: { value: "Enter Task" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Enter Task")).toBeInTheDocument();
  });

  it("should default priority to Medium", async () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);

    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task A" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));

    await act(async () => {
      fireEvent.click(screen.getByText("Save Tasks & Finish"));
    });

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    );
    expect(body.tasks[0].priority).toBe("Medium");
  });

  it("should default duration to 60 when no duration is specified", async () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);

    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task B" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));

    await act(async () => {
      fireEvent.click(screen.getByText("Save Tasks & Finish"));
    });

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    );
    expect(body.tasks[0].duration).toBe(60);
  });

  it("should include relativeOffsetDays of -1 for 1-before default mode", async () => {
    render(<TaskPromptSection {...createTaskPromptProps()} />);

    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task C" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));

    await act(async () => {
      fireEvent.click(screen.getByText("Save Tasks & Finish"));
    });

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    );
    expect(body.tasks[0].relativeOffsetDays).toBe(-1);
  });
});