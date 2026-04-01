import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import ScheduleDrawer from "../ScheduleDrawer";

// ── Mocks 

jest.mock("@/lib/ui", () => ({
  PRIORITY_TEXT: { high: "text-red-400", medium: "text-yellow-400", low: "text-green-400" },
}));

jest.mock("../FutureTasksPanel", () => ({
  __esModule: true,
  default: ({ futureTasks }: any) => (
    <div data-testid="future-tasks-panel">{futureTasks.length} future tasks</div>
  ),
}));

jest.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DrawerContent: ({ children }: any) => <div>{children}</div>,
  DrawerHeader: ({ children }: any) => <div>{children}</div>,
  DrawerTitle: ({ children }: any) => <h1>{children}</h1>,
  DrawerDescription: ({ children }: any) => <p>{children}</p>,
  DrawerFooter: ({ children }: any) => <div>{children}</div>,
  DrawerClose: ({ children, onClick }: any) => <Button onClick={onClick}>{children}</Button>,
}));

// ── Helpers ────────

const baseState = {
  showScheduleDialog: true,
  scheduleMode: "week" as const,
  scheduleDate: "2030-01-07",
  scheduleWeekStart: "2030-01-06",
  scheduleDialogTasks: [],
  selectedTaskIds: [] as string[],
  unavailableDays: [] as string[],
  skipBreaks: false,
  breakSessionMins: 90,
  breakLengthMins: 15,
  requiresConfirmation: false,
  overCapacityTasks: [] as any[],
  missedDeadlineTasks: [] as any[],
  isScheduling: false,
  showFutureTasks: false,
  selectedFutureTaskIds: [] as string[],
  futureModeAuto: true,
};

const mockPatch = jest.fn();
const mockOnSchedule = jest.fn();
const mockOnScheduleForced = jest.fn();
const mockOnClose = jest.fn();

function renderDrawer(stateOverrides = {}) {
  return render(
    <ScheduleDrawer
      state={{ ...baseState, ...stateOverrides }}
      patch={mockPatch}
      onSchedule={mockOnSchedule}
      onScheduleForced={mockOnScheduleForced}
      onClose={mockOnClose}
    />,
  );
}

beforeEach(() => jest.clearAllMocks());

// ── Rendering ──────

describe("ScheduleDrawer — rendering", () => {
  it("renders nothing when showScheduleDialog is false", () => {
    renderDrawer({ showScheduleDialog: false });
    expect(screen.queryByText("Schedule My Week")).not.toBeInTheDocument();
  });

  it("shows Schedule My Week title in week mode", () => {
    renderDrawer();
    expect(screen.getByText("Schedule My Week")).toBeInTheDocument();
  });

  it("shows Schedule My Day title in day mode", () => {
    renderDrawer({ scheduleMode: "day" });
    expect(screen.getByText("Schedule My Day")).toBeInTheDocument();
  });

  it("shows formatted date range in week mode", () => {
    renderDrawer();
    expect(screen.getByText(/Jan 6/)).toBeInTheDocument();
  });

  it("shows formatted single date in day mode", () => {
    renderDrawer({ scheduleMode: "day", scheduleDate: "2030-01-07" });
    expect(screen.getByText(/Monday.*Jan 7.*2030/i)).toBeInTheDocument();
  });

  it("renders the FutureTasksPanel", () => {
    renderDrawer();
    expect(screen.getByTestId("future-tasks-panel")).toBeInTheDocument();
  });
});

// ── Scheduled tasks panel ──

describe("ScheduleDrawer — scheduled tasks panel", () => {
  it("shows empty message when no tasks scheduled for the period", () => {
    renderDrawer();
    expect(screen.getByText(/No tasks scheduled yet/i)).toBeInTheDocument();
  });

  it("shows tasks scheduled within the week", () => {
    const tasks = [{
      id: "t1", title: "Write report", duration: 60, completed: false,
      scheduledDate: "2030-01-07T10:00:00", priority: "high", dueDate: null,
    }];
    renderDrawer({ scheduleDialogTasks: tasks });
    expect(screen.getByText("Write report")).toBeInTheDocument();
  });

  it("does not show completed tasks in the scheduled panel", () => {
    const tasks = [{
      id: "t1", title: "Done task", duration: 60, completed: true,
      scheduledDate: "2030-01-07T10:00:00", priority: "high", dueDate: null,
    }];
    renderDrawer({ scheduleDialogTasks: tasks });
    expect(screen.queryByText("Done task")).not.toBeInTheDocument();
  });
});

// ── Unscheduled tasks ──────

describe("ScheduleDrawer — unscheduled tasks", () => {
  const unscheduledTask = {
    id: "u1", title: "Unscheduled task", duration: 45, completed: false,
    scheduledDate: null, priority: "medium", dueDate: null,
  };

  it("shows unscheduled tasks section when tasks exist", () => {
    renderDrawer({ scheduleDialogTasks: [unscheduledTask] });
    expect(screen.getByText("Unscheduled task")).toBeInTheDocument();
  });

  it("does not show unscheduled section when no unscheduled tasks", () => {
    renderDrawer();
    expect(screen.queryByText(/Add unscheduled tasks/i)).not.toBeInTheDocument();
  });

  it("toggles task selection on click", () => {
    renderDrawer({ scheduleDialogTasks: [unscheduledTask] });
    fireEvent.click(screen.getByText("Unscheduled task").closest("div[class*='rounded-xl']")!);
    expect(mockPatch).toHaveBeenCalledWith({ selectedTaskIds: ["u1"] });
  });

  it("deselects already selected task on click", () => {
    renderDrawer({ scheduleDialogTasks: [unscheduledTask], selectedTaskIds: ["u1"] });
    fireEvent.click(screen.getByText("Unscheduled task").closest("div[class*='rounded-xl']")!);
    expect(mockPatch).toHaveBeenCalledWith({ selectedTaskIds: [] });
  });

  it("shows due date when task has a dueDate", () => {
    const task = { ...unscheduledTask, dueDate: "2030-02-01" };
    renderDrawer({ scheduleDialogTasks: [task] });
    expect(screen.getByText(/Due Feb 1/i)).toBeInTheDocument();
  });

  it("shows checkmark when task is selected", () => {
    renderDrawer({ scheduleDialogTasks: [unscheduledTask], selectedTaskIds: ["u1"] });
    expect(screen.getByText("✓")).toBeInTheDocument();
  });
});

// ── Unavailable days ───────

describe("ScheduleDrawer — unavailable days", () => {
  it("shows day buttons in week mode", () => {
    renderDrawer();
    expect(screen.getByRole("button", { name: /Mon/i })).toBeInTheDocument();
  });

  it("does not show day buttons in day mode", () => {
    renderDrawer({ scheduleMode: "day" });
    expect(screen.queryByText(/unavailable/i)).not.toBeInTheDocument();
  });

  it("toggles unavailable day on click", () => {
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: /Sun/i }));
    expect(mockPatch).toHaveBeenCalledWith({ unavailableDays: ["2030-01-06"] });
  });

  it("removes day from unavailable when clicked again", () => {
    renderDrawer({ unavailableDays: ["2030-01-06"] });
    fireEvent.click(screen.getByRole("button", { name: /Sun/i }));
    expect(mockPatch).toHaveBeenCalledWith({ unavailableDays: [] });
  });
});

// ── Break settings ─

describe("ScheduleDrawer — break settings", () => {
  it("shows session and break length inputs when skipBreaks is false", () => {
    renderDrawer();
    expect(screen.getByDisplayValue("90")).toBeInTheDocument();
    expect(screen.getByDisplayValue("15")).toBeInTheDocument();
  });

  it("hides inputs when skipBreaks is true", () => {
    renderDrawer({ skipBreaks: true });
    expect(screen.queryByDisplayValue("90")).not.toBeInTheDocument();
  });

  it("toggles skipBreaks on toggle click", () => {
    renderDrawer();
    fireEvent.click(screen.getByText("Skip breaks").closest("div[class*='cursor-pointer']")!);
    expect(mockPatch).toHaveBeenCalledWith({ skipBreaks: true });
  });

  it("updates breakSessionMins on input change", () => {
    renderDrawer();
    fireEvent.change(screen.getByDisplayValue("90"), { target: { value: "60" } });
    expect(mockPatch).toHaveBeenCalledWith({ breakSessionMins: 60 });
  });

  it("updates breakLengthMins on input change", () => {
    renderDrawer();
    fireEvent.change(screen.getByDisplayValue("15"), { target: { value: "10" } });
    expect(mockPatch).toHaveBeenCalledWith({ breakLengthMins: 10 });
  });
});

// ── Warning banners 

describe("ScheduleDrawer — over capacity warning", () => {
  const overCapacityState = {
    requiresConfirmation: true,
    overCapacityTasks: [{ taskId: "t1", title: "Big task" }],
  };

  it("shows over capacity warning banner", () => {
    renderDrawer(overCapacityState);
    expect(screen.getByText(/Not all tasks fit/i)).toBeInTheDocument();
    expect(screen.getByText(/Big task/i)).toBeInTheDocument();
  });

  it("calls onScheduleForced when Schedule What Fits is clicked", () => {
    renderDrawer(overCapacityState);
    fireEvent.click(screen.getByText("Schedule What Fits"));
    expect(mockOnScheduleForced).toHaveBeenCalled();
  });

  it("calls patch to clear confirmation when Go Back is clicked", () => {
    renderDrawer(overCapacityState);
    fireEvent.click(screen.getByText("Go Back"));
    expect(mockPatch).toHaveBeenCalledWith({ requiresConfirmation: false, overCapacityTasks: [] });
  });

  it("hides Create Schedule button when requiresConfirmation is true", () => {
    renderDrawer(overCapacityState);
    expect(screen.queryByText("Create Schedule")).not.toBeInTheDocument();
  });
});

describe("ScheduleDrawer — missed deadline warning", () => {
  const missedState = {
    missedDeadlineTasks: [{ taskId: "t2", title: "Late task" }],
    requiresConfirmation: false,
  };

  it("shows missed deadline banner", () => {
    renderDrawer(missedState);
    expect(screen.getByText(/late task/i)).toBeInTheDocument();
  });

  it("calls onClose when Close button in missed deadline banner is clicked", () => {
    renderDrawer(missedState);
    fireEvent.click(screen.getByText("Close"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("hides Create Schedule button when missedDeadlineTasks is non-empty", () => {
    renderDrawer(missedState);
    expect(screen.queryByText("Create Schedule")).not.toBeInTheDocument();
  });
});

// ── Footer ─────────

describe("ScheduleDrawer — footer", () => {
  it("shows Create Schedule button when no warnings", () => {
    renderDrawer();
    expect(screen.getByText("Create Schedule")).toBeInTheDocument();
  });

  it("calls onSchedule when Create Schedule is clicked", () => {
    renderDrawer();
    fireEvent.click(screen.getByText("Create Schedule"));
    expect(mockOnSchedule).toHaveBeenCalled();
  });

  it("shows Scheduling when isScheduling is true", () => {
    renderDrawer({ isScheduling: true });
    expect(screen.getByText("Scheduling…")).toBeInTheDocument();
  });

  it("disables button when isScheduling is true", () => {
    renderDrawer({ isScheduling: true });
    expect(screen.getByText("Scheduling…").closest("button")).toBeDisabled();
  });
});

// ── Date input ─────

describe("ScheduleDrawer — date input", () => {
  it("patches scheduleDate in day mode on date change", () => {
    renderDrawer({ scheduleMode: "day" });
    fireEvent.change(screen.getByDisplayValue("2030-01-07"), { target: { value: "2030-01-08" } });
    expect(mockPatch).toHaveBeenCalledWith(expect.objectContaining({ scheduleDate: "2030-01-08" }));
  });

  it("patches scheduleWeekStart in week mode on date change", () => {
    renderDrawer();
    fireEvent.change(screen.getByDisplayValue("2030-01-06"), { target: { value: "2030-01-13" } });
    expect(mockPatch).toHaveBeenCalledWith(expect.objectContaining({ scheduleWeekStart: "2030-01-13" }));
  });

  it("resets confirmation state on date change", () => {
    renderDrawer();
    fireEvent.change(screen.getByDisplayValue("2030-01-06"), { target: { value: "2030-01-13" } });
    expect(mockPatch).toHaveBeenCalledWith(expect.objectContaining({
      requiresConfirmation: false,
      overCapacityTasks: [],
      missedDeadlineTasks: [],
    }));
  });
});

// ── Close button ───

describe("ScheduleDrawer — close", () => {
  it("calls onClose when the X button is clicked", () => {
    renderDrawer();
    fireEvent.click(screen.getByText("✕"));
    expect(mockOnClose).toHaveBeenCalled();
  });
});