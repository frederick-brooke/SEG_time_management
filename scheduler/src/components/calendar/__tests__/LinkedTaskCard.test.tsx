import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LinkedTaskCard } from "../LinkedTaskCard";

// Mocks

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

jest.mock("@/lib/ui", () => ({
  PRIORITY_TEXT: {
    Low: "text-green-400",
    Medium: "text-orange-400",
    High: "text-red-400",
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

// Fixtures

const baseTask = {
  id: "task-1",
  title: "Write tests",
  duration: 45,
  priority: "High",
  relativeMode: "1-before",
  isRecurring: false,
  scheduleTime: false,
  specificTime: "09:00",
  useRange: false,
  customDate: null,
  customRangeStart: null,
  customRangeEnd: null,
  recurrence: null,
};

const defaultProps = {
  task: baseTask,
  index: 0,
  eventStartDate: "2026-04-01",
  onUpdate: jest.fn(),
  onRemove: jest.fn(),
};

function renderCard(props = {}) {
  return render(<LinkedTaskCard {...defaultProps} {...props} />);
}

// Rendering — collapsed state
describe("LinkedTaskCard — rendering (collapsed)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the task title", () => {
    renderCard();
    expect(screen.getByText("Write tests")).toBeInTheDocument();
  });

  it("renders task duration", () => {
    renderCard();
    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("renders task priority", () => {
    renderCard();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders the relative mode label", () => {
    renderCard();
    expect(screen.getByText("1 day before")).toBeInTheDocument();
  });

  it("renders the expand button with ▼", () => {
    renderCard();
    expect(screen.getByText("▼")).toBeInTheDocument();
  });

  it("renders the remove button", () => {
    renderCard();
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("does not show scheduleTime badge when scheduleTime is false", () => {
    renderCard();
    expect(screen.queryByText(/⏰/)).not.toBeInTheDocument();
  });

  it("does not show recurring badge when isRecurring is false", () => {
    renderCard();
    expect(screen.queryByText("🔁")).not.toBeInTheDocument();
  });

  it("shows scheduleTime badge when scheduleTime is true", () => {
    renderCard({ task: { ...baseTask, scheduleTime: true, specificTime: "14:00" } });
    expect(screen.getByText("⏰ 14:00")).toBeInTheDocument();
  });

  it("shows recurring badge when isRecurring is true", () => {
    renderCard({ task: { ...baseTask, isRecurring: true, recurrence: { type: "weekly", days: [], until: null } } });
    expect(screen.getByText("🔁")).toBeInTheDocument();
  });
});

// Expand / collapse
describe("LinkedTaskCard — expand/collapse", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not show expanded content initially", () => {
    renderCard();
    expect(screen.queryByText("Schedule relative to event")).not.toBeInTheDocument();
  });

  it("shows expanded content after clicking expand button", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    expect(screen.getByText("Schedule relative to event")).toBeInTheDocument();
  });

  it("changes expand button to ▲ when expanded", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    expect(screen.getByText("▲")).toBeInTheDocument();
  });

  it("collapses again when ▲ is clicked", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("▲"));
    expect(screen.queryByText("Schedule relative to event")).not.toBeInTheDocument();
  });
});

// onRemove
describe("LinkedTaskCard — onRemove", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls onRemove with the correct index when ✕ is clicked", () => {
    renderCard();
    fireEvent.click(screen.getByText("✕"));
    expect(defaultProps.onRemove).toHaveBeenCalledWith(0);
  });

  it("passes the correct index when index prop is non-zero", () => {
    renderCard({ index: 3 });
    fireEvent.click(screen.getByText("✕"));
    expect(defaultProps.onRemove).toHaveBeenCalledWith(3);
  });
});

// useEffect — onUpdate called on mount and state changes
describe("LinkedTaskCard — onUpdate via useEffect", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls onUpdate on initial mount", () => {
    renderCard();
    expect(defaultProps.onUpdate).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        relativeMode: "1-before",
        scheduledRelativeTo: "before",
        relativeOffsetDays: -1,
        isRecurring: false,
        recurrence: null,
        scheduleTime: false,
        specificTime: null,
      }),
    );
  });

  it("calls onUpdate with updated mode when relative option is changed", async () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Same day"));
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        0,
        expect.objectContaining({
          relativeMode: "same-day",
          scheduledRelativeTo: "during",
          relativeOffsetDays: 0,
        }),
      );
    });
  });

  it("calls onUpdate with scheduleTime true when toggle is clicked", async () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByTestId("toggle-Schedule for a specific time?"));
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ scheduleTime: true }),
      );
    });
  });

  it("calls onUpdate with isRecurring true when toggle is clicked", async () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByTestId("toggle-One-time task"));
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        0,
        expect.objectContaining({
          isRecurring: true,
          recurrence: expect.objectContaining({ type: "weekly" }),
        }),
      );
    });
  });

  it("includes customDate in payload when mode is custom and useRange is false", async () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Custom date"));
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        0,
        expect.objectContaining({
          relativeMode: "custom",
          customDate: "2026-04-01",
          customRangeStart: null,
          customRangeEnd: null,
        }),
      );
    });
  });
});

// Expanded — scheduleTime section
describe("LinkedTaskCard — expanded, scheduleTime", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows hint text when scheduleTime is off", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    expect(
      screen.getByText("Task will appear in Unscheduled Tasks until you schedule it."),
    ).toBeInTheDocument();
  });

  it("shows time input when scheduleTime is toggled on", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByTestId("toggle-Schedule for a specific time?"));
    expect(screen.getByDisplayValue("09:00")).toBeInTheDocument();
  });
});

// Expanded — isRecurring section
describe("LinkedTaskCard — expanded, isRecurring", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not show RecurrencePanel when isRecurring is off", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    expect(screen.queryByTestId("recurrence-panel")).not.toBeInTheDocument();
  });

  it("shows RecurrencePanel when isRecurring is toggled on", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByTestId("toggle-One-time task"));
    expect(screen.getByTestId("recurrence-panel")).toBeInTheDocument();
  });

  it("sends empty days array for daily recurrence type", async () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByTestId("toggle-One-time task"));
    fireEvent.click(screen.getByText("Set Daily"));
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        0,
        expect.objectContaining({
          recurrence: expect.objectContaining({ type: "daily", days: [] }),
        }),
      );
    });
  });

  it("sends recDays for weekly recurrence type", async () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByTestId("toggle-One-time task"));
    fireEvent.click(screen.getByText("Set Days"));
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        0,
        expect.objectContaining({
          recurrence: expect.objectContaining({ days: ["Mon"] }),
        }),
      );
    });
  });
});

// Expanded — CustomDatePicker
describe("LinkedTaskCard — expanded, CustomDatePicker", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not show CustomDatePicker for non-custom mode", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    expect(screen.queryByText("Use a date range")).not.toBeInTheDocument();
  });

  it("shows CustomDatePicker when custom mode is selected", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Custom date"));
    expect(screen.getByText("Use a date range")).toBeInTheDocument();
  });

  it("hides CustomDatePicker when switching away from custom mode", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Custom date"));
    fireEvent.click(screen.getByText("Same day"));
    expect(screen.queryByText("Use a date range")).not.toBeInTheDocument();
  });
});

// CustomDatePicker — range inputs
describe("LinkedTaskCard — CustomDatePicker range inputs", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows range inputs when Use a date range is checked", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Custom date"));
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
  });

  it("hides single date input when range is enabled", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Custom date"));
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.queryByText("Date")).not.toBeInTheDocument();
  });

  it("shows single date input when range is disabled", () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Custom date"));
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("calls onUpdate with rangeStart and rangeEnd when useRange is true", async () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Custom date"));
    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        0,
        expect.objectContaining({
          useRange: true,
          customDate: null,
          customRangeStart: "2026-04-01",
          customRangeEnd: "2026-04-01",
        }),
      );
    });
  });

  it("updates rangeStart when From date input changes", async () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Custom date"));
    fireEvent.click(screen.getByRole("checkbox"));
    const inputs = screen.getAllByDisplayValue("2026-04-01");
    fireEvent.change(inputs[0], { target: { value: "2026-05-01" } });
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ customRangeStart: "2026-05-01" }),
      );
    });
  });

  it("updates rangeEnd when To date input changes", async () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Custom date"));
    fireEvent.click(screen.getByRole("checkbox"));
    const inputs = screen.getAllByDisplayValue("2026-04-01");
    fireEvent.change(inputs[1], { target: { value: "2026-06-01" } });
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ customRangeEnd: "2026-06-01" }),
      );
    });
  });

  it("updates customDate when single date input changes", async () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("Custom date"));
    const dateInput = screen.getByDisplayValue("2026-04-01");
    fireEvent.change(dateInput, { target: { value: "2026-07-01" } });
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ customDate: "2026-07-01" }),
      );
    });
  });
});

// specificTime input update
describe("LinkedTaskCard — specificTime input", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls onUpdate with updated specificTime when time input changes", async () => {
    renderCard();
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByTestId("toggle-Schedule for a specific time?"));
    fireEvent.change(screen.getByDisplayValue("09:00"), {
      target: { value: "15:45" },
    });
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ specificTime: "15:45" }),
      );
    });
  });
});

// Initial state from task prop
describe("LinkedTaskCard — initialised from task prop", () => {
  it("initialises mode from task.relativeMode", () => {
    renderCard({ task: { ...baseTask, relativeMode: "2-after" } });
    expect(screen.getByText("2 days after")).toBeInTheDocument();
  });

  it("initialises scheduleTime badge from task.scheduleTime", () => {
    renderCard({ task: { ...baseTask, scheduleTime: true, specificTime: "10:30" } });
    expect(screen.getByText("⏰ 10:30")).toBeInTheDocument();
  });

  it("initialises isRecurring badge from task.isRecurring", () => {
    renderCard({
      task: { ...baseTask, isRecurring: true, recurrence: { type: "weekly", days: [], until: null } },
    });
    expect(screen.getByText("🔁")).toBeInTheDocument();
  });
});