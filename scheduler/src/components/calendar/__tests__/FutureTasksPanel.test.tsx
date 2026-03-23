import { render, screen, fireEvent } from "@testing-library/react";
import FutureTasksPanel from "../FutureTasksPanel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("@/lib/ui", () => ({
  PRIORITY_TEXT: {
    Low: "text-green-400",
    Medium: "text-orange-400",
    High: "text-red-400",
  },
}));

jest.mock("date-fns", () => ({
  format: (_date: Date, _fmt: string) => "Apr 1",
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const basePatch = jest.fn();

const baseState: any = {
  scheduleMode: "week",
  showFutureTasks: false,
  futureModeAuto: true,
  selectedFutureTaskIds: [],
};

const taskA = {
  id: "task-1",
  title: "Task A",
  priority: "High" as const,
  duration: 60,
  completed: false,
  scheduledDate: "2026-05-01",
};

const taskB = {
  id: "task-2",
  title: "Task B",
  priority: "Low" as const,
  duration: 30,
  completed: false,
  dueDate: "2026-05-10",
  scheduledDate: "2026-05-02",
};

// ---------------------------------------------------------------------------
// Null render
// ---------------------------------------------------------------------------

describe("FutureTasksPanel — null render", () => {
  it("renders nothing when futureTasks is empty", () => {
    const { container } = render(
      <FutureTasksPanel state={baseState} patch={basePatch} futureTasks={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

describe("FutureTasksPanel — header", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the header prompt with scheduleMode", () => {
    render(
      <FutureTasksPanel state={baseState} patch={basePatch} futureTasks={[taskA]} />,
    );
    expect(screen.getByText("Tackle future tasks this week?")).toBeInTheDocument();
  });

  it('shows "day" in header when scheduleMode is day', () => {
    render(
      <FutureTasksPanel
        state={{ ...baseState, scheduleMode: "day" }}
        patch={basePatch}
        futureTasks={[taskA]}
      />,
    );
    expect(screen.getByText("Tackle future tasks this day?")).toBeInTheDocument();
  });

  it("shows singular task count for 1 task", () => {
    render(
      <FutureTasksPanel state={baseState} patch={basePatch} futureTasks={[taskA]} />,
    );
    expect(screen.getByText(/1 task\s+beyond this period/)).toBeInTheDocument();
  });

  it("shows plural task count for multiple tasks", () => {
    render(
      <FutureTasksPanel
        state={baseState}
        patch={basePatch}
        futureTasks={[taskA, taskB]}
      />,
    );
    expect(screen.getByText(/2 tasks\s+beyond this period/)).toBeInTheDocument();
  });

  it("calls patch with toggled showFutureTasks when header is clicked", () => {
    render(
      <FutureTasksPanel state={baseState} patch={basePatch} futureTasks={[taskA]} />,
    );
    fireEvent.click(screen.getByText("Tackle future tasks this week?").closest("div")!);
    expect(basePatch).toHaveBeenCalledWith({ showFutureTasks: true });
  });

  it("toggles showFutureTasks from true to false", () => {
    render(
      <FutureTasksPanel
        state={{ ...baseState, showFutureTasks: true }}
        patch={basePatch}
        futureTasks={[taskA]}
      />,
    );
    fireEvent.click(screen.getByText("Tackle future tasks this week?").closest("div")!);
    expect(basePatch).toHaveBeenCalledWith({ showFutureTasks: false });
  });
});

// ---------------------------------------------------------------------------
// Expanded panel — hidden when showFutureTasks is false
// ---------------------------------------------------------------------------

describe("FutureTasksPanel — collapsed state", () => {
  it("does not show Auto-pick or I'll choose buttons when collapsed", () => {
    render(
      <FutureTasksPanel state={baseState} patch={basePatch} futureTasks={[taskA]} />,
    );
    expect(screen.queryByText("✨ Auto-pick")).not.toBeInTheDocument();
    expect(screen.queryByText("✋ I'll choose")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Expanded panel — mode buttons
// ---------------------------------------------------------------------------

describe("FutureTasksPanel — expanded, mode buttons", () => {
  const expandedState = { ...baseState, showFutureTasks: true };

  beforeEach(() => jest.clearAllMocks());

  it("shows Auto-pick and I'll choose buttons when expanded", () => {
    render(
      <FutureTasksPanel state={expandedState} patch={basePatch} futureTasks={[taskA]} />,
    );
    expect(screen.getByText("✨ Auto-pick")).toBeInTheDocument();
    expect(screen.getByText("✋ I'll choose")).toBeInTheDocument();
  });

  it("calls patch with futureModeAuto true when Auto-pick is clicked", () => {
    render(
      <FutureTasksPanel state={expandedState} patch={basePatch} futureTasks={[taskA]} />,
    );
    fireEvent.click(screen.getByText("✨ Auto-pick"));
    expect(basePatch).toHaveBeenCalledWith({ futureModeAuto: true });
  });

  it("calls patch with futureModeAuto false when I'll choose is clicked", () => {
    render(
      <FutureTasksPanel state={expandedState} patch={basePatch} futureTasks={[taskA]} />,
    );
    fireEvent.click(screen.getByText("✋ I'll choose"));
    expect(basePatch).toHaveBeenCalledWith({ futureModeAuto: false });
  });
});

// ---------------------------------------------------------------------------
// Expanded panel — auto mode
// ---------------------------------------------------------------------------

describe("FutureTasksPanel — auto mode", () => {
  const autoState = { ...baseState, showFutureTasks: true, futureModeAuto: true };

  it("shows auto description text", () => {
    render(
      <FutureTasksPanel state={autoState} patch={basePatch} futureTasks={[taskA]} />,
    );
    expect(
      screen.getByText("The algorithm fills spare capacity automatically."),
    ).toBeInTheDocument();
  });

  it("does not render task rows in auto mode", () => {
    render(
      <FutureTasksPanel state={autoState} patch={basePatch} futureTasks={[taskA]} />,
    );
    expect(screen.queryByText("Task A")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Expanded panel — manual mode / task rows
// ---------------------------------------------------------------------------

describe("FutureTasksPanel — manual mode, task rows", () => {
  const manualState = {
    ...baseState,
    showFutureTasks: true,
    futureModeAuto: false,
    selectedFutureTaskIds: [],
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders all task rows in manual mode", () => {
    render(
      <FutureTasksPanel
        state={manualState}
        patch={basePatch}
        futureTasks={[taskA, taskB]}
      />,
    );
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Task B")).toBeInTheDocument();
  });

  it("renders task priority", () => {
    render(
      <FutureTasksPanel state={manualState} patch={basePatch} futureTasks={[taskA]} />,
    );
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders task duration", () => {
    render(
      <FutureTasksPanel state={manualState} patch={basePatch} futureTasks={[taskA]} />,
    );
    expect(screen.getByText("60m")).toBeInTheDocument();
  });

  it("renders due date when present", () => {
    render(
      <FutureTasksPanel state={manualState} patch={basePatch} futureTasks={[taskB]} />,
    );
    expect(screen.getByText(/Due Apr 1/)).toBeInTheDocument();
  });

  it("does not render due date when absent", () => {
    render(
      <FutureTasksPanel state={manualState} patch={basePatch} futureTasks={[taskA]} />,
    );
    expect(screen.queryByText(/Due/)).not.toBeInTheDocument();
  });

  it("shows checkmark for selected tasks", () => {
    render(
      <FutureTasksPanel
        state={{ ...manualState, selectedFutureTaskIds: ["task-1"] }}
        patch={basePatch}
        futureTasks={[taskA]}
      />,
    );
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("does not show checkmark for unselected tasks", () => {
    render(
      <FutureTasksPanel state={manualState} patch={basePatch} futureTasks={[taskA]} />,
    );
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// toggleId logic via task row clicks
// ---------------------------------------------------------------------------

describe("FutureTasksPanel — toggleId via task row", () => {
  const manualState = {
    ...baseState,
    showFutureTasks: true,
    futureModeAuto: false,
    selectedFutureTaskIds: [],
  };

  beforeEach(() => jest.clearAllMocks());

  it("adds task id to selectedFutureTaskIds when unselected task is clicked", () => {
    render(
      <FutureTasksPanel state={manualState} patch={basePatch} futureTasks={[taskA]} />,
    );
    fireEvent.click(screen.getByText("Task A"));
    expect(basePatch).toHaveBeenCalledWith({
      selectedFutureTaskIds: ["task-1"],
    });
  });

  it("removes task id from selectedFutureTaskIds when selected task is clicked", () => {
    render(
      <FutureTasksPanel
        state={{ ...manualState, selectedFutureTaskIds: ["task-1"] }}
        patch={basePatch}
        futureTasks={[taskA]}
      />,
    );
    fireEvent.click(screen.getByText("Task A"));
    expect(basePatch).toHaveBeenCalledWith({
      selectedFutureTaskIds: [],
    });
  });

  it("preserves other selected ids when toggling one task", () => {
    render(
      <FutureTasksPanel
        state={{ ...manualState, selectedFutureTaskIds: ["task-2"] }}
        patch={basePatch}
        futureTasks={[taskA, taskB]}
      />,
    );
    fireEvent.click(screen.getByText("Task A"));
    expect(basePatch).toHaveBeenCalledWith({
      selectedFutureTaskIds: ["task-2", "task-1"],
    });
  });
});