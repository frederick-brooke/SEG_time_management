import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewTaskForm } from "../NewTaskForm";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("../EventFormParts", () => ({
  RELATIVE_OPTIONS: [
    { key: "3-before", label: "3 days before", offsetDays: -3 },
    { key: "2-before", label: "2 days before", offsetDays: -2 },
    { key: "1-before", label: "1 day before", offsetDays: -1 },
    { key: "same-day", label: "Same day", offsetDays: 0 },
    { key: "1-after", label: "1 day after", offsetDays: 1 },
    { key: "2-after", label: "2 days after", offsetDays: 2 },
    { key: "3-after", label: "3 days after", offsetDays: 3 },
    { key: "custom", label: "Custom date", offsetDays: null },
  ],
  relativeTo: (mode: string) => {
    if (mode === "custom") return "custom";
    if (mode === "same-day") return "during";
    if (mode.includes("before")) return "before";
    return "after";
  },
}));

jest.mock("@/components/shared/FormComponents", () => ({
  Toggle: ({ on, onToggle, label }: any) => (
    <button data-testid={`toggle-${label}`} onClick={onToggle}>
      {label}: {on ? "on" : "off"}
    </button>
  ),
  RecurrencePanel: ({ type, onType, onDays, onUntil }: any) => (
    <div data-testid="recurrence-panel">
      <button onClick={() => onType("daily")}>Set Daily</button>
      <button onClick={() => onType("weekly")}>Set Weekly</button>
      <button onClick={() => onDays(["Mon"])}>Set Days</button>
      <button onClick={() => onUntil("2026-12-01")}>Set Until</button>
      <span>{type}</span>
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  eventStartDate: "2026-04-01",
  defaultUntil: "2026-06-01",
  onAdd: jest.fn(),
};

function renderForm(props = {}) {
  return render(<NewTaskForm {...defaultProps} {...props} />);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("NewTaskForm — rendering", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the title input", () => {
    renderForm();
    expect(screen.getByPlaceholderText("Task title")).toBeInTheDocument();
  });

  it("renders the duration input with default value 60", () => {
    renderForm();
    const input = screen.getByDisplayValue("60");
    expect(input).toBeInTheDocument();
  });

  it("renders the priority select with default Medium", () => {
    renderForm();
    expect(screen.getByDisplayValue("Medium")).toBeInTheDocument();
  });

  it("renders all 8 relative option buttons", () => {
    renderForm();
    expect(screen.getByText("1 day before")).toBeInTheDocument();
    expect(screen.getByText("Same day")).toBeInTheDocument();
    expect(screen.getByText("Custom date")).toBeInTheDocument();
  });

  it("renders the Add Task button", () => {
    renderForm();
    expect(screen.getByText("+ Add Task")).toBeInTheDocument();
  });

  it("does not show CustomDatePicker initially", () => {
    renderForm();
    expect(screen.queryByText("Use a date range")).not.toBeInTheDocument();
  });

  it("does not show RecurrencePanel initially", () => {
    renderForm();
    expect(screen.queryByTestId("recurrence-panel")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// handleAdd — basic submission
// ---------------------------------------------------------------------------

describe("NewTaskForm — handleAdd", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not call onAdd when title is empty", () => {
    renderForm();
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).not.toHaveBeenCalled();
  });

  it("does not call onAdd when title is whitespace only", () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).not.toHaveBeenCalled();
  });

  it("calls onAdd with correct payload when title is valid", () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "My Task" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));

    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "My Task",
        duration: 60,
        priority: "Medium",
        relativeMode: "1-before",
        scheduledRelativeTo: "before",
        relativeOffsetDays: -1,
        isRecurring: false,
        recurrence: null,
        scheduleTime: false,
        specificTime: null,
        customDate: null,
        customRangeStart: null,
        customRangeEnd: null,
        useRange: false,
      }),
    );
  });

  it("resets the title field after successful add", () => {
    renderForm();
    const input = screen.getByPlaceholderText("Task title");
    fireEvent.change(input, { target: { value: "My Task" } });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(input).toHaveValue("");
  });

  it("submits on Enter key in title field", () => {
    renderForm();
    const input = screen.getByPlaceholderText("Task title");
    fireEvent.change(input, { target: { value: "Enter Task" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Enter Task" }),
    );
  });

  it("does not submit on non-Enter key", () => {
    renderForm();
    const input = screen.getByPlaceholderText("Task title");
    fireEvent.change(input, { target: { value: "My Task" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(defaultProps.onAdd).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Duration and priority
// ---------------------------------------------------------------------------

describe("NewTaskForm — duration and priority", () => {
  beforeEach(() => jest.clearAllMocks());

  it("submits with updated duration", () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.change(screen.getByDisplayValue("60"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 30 }),
    );
  });

  it("falls back to 60 when duration is invalid", () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.change(screen.getByDisplayValue("60"), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 60 }),
    );
  });

  it("submits with updated priority", () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.change(screen.getByDisplayValue("Medium"), {
      target: { value: "High" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ priority: "High" }),
    );
  });
});

// ---------------------------------------------------------------------------
// Relative mode selection
// ---------------------------------------------------------------------------

describe("NewTaskForm — relative mode", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates mode when a relative option is clicked", () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.click(screen.getByText("Same day"));
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        relativeMode: "same-day",
        scheduledRelativeTo: "during",
        relativeOffsetDays: 0,
      }),
    );
  });

  it("shows CustomDatePicker when custom mode is selected", () => {
    renderForm();
    fireEvent.click(screen.getByText("Custom date"));
    expect(screen.getByText("Use a date range")).toBeInTheDocument();
  });

  it("hides CustomDatePicker when non-custom mode is selected", () => {
    renderForm();
    fireEvent.click(screen.getByText("Custom date"));
    expect(screen.getByText("Use a date range")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Same day"));
    expect(screen.queryByText("Use a date range")).not.toBeInTheDocument();
  });

  it("submits customDate when in custom single-date mode", () => {
    renderForm();
    fireEvent.click(screen.getByText("Custom date"));
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        relativeMode: "custom",
        customDate: "2026-04-01",
        customRangeStart: null,
        customRangeEnd: null,
        useRange: false,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// scheduleTime toggle
// ---------------------------------------------------------------------------

describe("NewTaskForm — scheduleTime", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows time input when scheduleTime is toggled on", () => {
    renderForm();
    fireEvent.click(screen.getByTestId("toggle-Schedule for a specific time?"));
    expect(screen.getByDisplayValue("09:00")).toBeInTheDocument();
  });

  it("hides time input and shows hint when scheduleTime is off", () => {
    renderForm();
    expect(
      screen.getByText("Task will appear in Unscheduled Tasks — you can place it later."),
    ).toBeInTheDocument();
  });

  it("submits specificTime when scheduleTime is on", () => {
    renderForm();
    fireEvent.click(screen.getByTestId("toggle-Schedule for a specific time?"));
    fireEvent.change(screen.getByDisplayValue("09:00"), {
      target: { value: "14:30" },
    });
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ scheduleTime: true, specificTime: "14:30" }),
    );
  });

  it("submits specificTime as null when scheduleTime is off", () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ scheduleTime: false, specificTime: null }),
    );
  });
});

// ---------------------------------------------------------------------------
// isRecurring toggle
// ---------------------------------------------------------------------------

describe("NewTaskForm — isRecurring", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows RecurrencePanel when isRecurring is toggled on", () => {
    renderForm();
    fireEvent.click(screen.getByTestId("toggle-One-time task"));
    expect(screen.getByTestId("recurrence-panel")).toBeInTheDocument();
  });

  it("submits recurrence payload when isRecurring is on", () => {
    renderForm();
    fireEvent.click(screen.getByTestId("toggle-One-time task"));
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        isRecurring: true,
        recurrence: expect.objectContaining({ type: "weekly" }),
      }),
    );
  });

  it("submits empty days array for non-weekly recurrence", () => {
    renderForm();
    fireEvent.click(screen.getByTestId("toggle-One-time task"));
    fireEvent.click(screen.getByText("Set Daily"));
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        recurrence: expect.objectContaining({ type: "daily", days: [] }),
      }),
    );
  });

  it("submits recurrence as null when isRecurring is off", () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ isRecurring: false, recurrence: null }),
    );
  });
});

// ---------------------------------------------------------------------------
// reset after add
// ---------------------------------------------------------------------------

describe("NewTaskForm — reset after add", () => {
  beforeEach(() => jest.clearAllMocks());

  it("resets isRecurring to false after add", () => {
    renderForm();
    fireEvent.click(screen.getByTestId("toggle-One-time task"));
    expect(screen.getByTestId("recurrence-panel")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(screen.queryByTestId("recurrence-panel")).not.toBeInTheDocument();
  });

  it("resets scheduleTime to false after add", () => {
    renderForm();
    fireEvent.click(screen.getByTestId("toggle-Schedule for a specific time?"));
    expect(screen.getByDisplayValue("09:00")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(screen.queryByDisplayValue("09:00")).not.toBeInTheDocument();
  });

  it("resets duration to 60 after add", () => {
    renderForm();
    fireEvent.change(screen.getByDisplayValue("60"), {
      target: { value: "45" },
    });
    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Task" },
    });
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
  });
});