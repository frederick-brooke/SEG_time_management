import { render, screen, fireEvent } from "@testing-library/react";
import { format } from "date-fns";
import UnscheduledPanel from "../UnscheduledPanel";

// Mocks

jest.mock("date-fns", () => ({
  format: jest.fn((date: Date, fmt: string) => {
    return `formatted(${date.toISOString()},${fmt})`;
  }),
}));

jest.mock("@/lib/scheduling/taskSchedulingUtils", () => ({
  getNextOccurrenceDeadline: jest.fn(),
}));

import { getNextOccurrenceDeadline } from "@/lib/scheduling/taskSchedulingUtils";
const mockGetNextOccurrenceDeadline = getNextOccurrenceDeadline as jest.Mock;

// Shared fixture helpers

const NOW = new Date("2024-06-15T12:00:00.000Z");

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetNextOccurrenceDeadline.mockReturnValue(null);
});

const baseProps = {
  unscheduledTasks: [],
  scheduleLogs: [],
  events: [],
  categories: [],
  onTaskClick: jest.fn(),
  onEditLog: jest.fn(),
  onDeleteLog: jest.fn(),
};

const daysFromNow = (days: number) =>
  new Date(NOW.getTime() + days * 86_400_000);

// UnscheduledPanel — empty states=

describe("UnscheduledPanel — empty states", () => {
  it("renders the 'Unscheduled Tasks' heading", () => {
    render(<UnscheduledPanel {...baseProps} />);
    expect(screen.getByText("Unscheduled Tasks")).toBeInTheDocument();
  });

  it("renders the 'Schedule Log' heading", () => {
    render(<UnscheduledPanel {...baseProps} />);
    expect(screen.getByText("Schedule Log")).toBeInTheDocument();
  });

  it("shows 'All tasks are scheduled!' when unscheduledTasks is empty", () => {
    render(<UnscheduledPanel {...baseProps} />);
    expect(screen.getByText("All tasks are scheduled!")).toBeInTheDocument();
  });

  it("shows 'No schedules created yet.' when scheduleLogs is empty", () => {
    render(<UnscheduledPanel {...baseProps} />);
    expect(screen.getByText("No schedules created yet.")).toBeInTheDocument();
  });
});

// UnscheduledPanel — unscheduled tasks list

describe("UnscheduledPanel — task cards", () => {
  const task = {
    id: "t1",
    title: "Write tests",
    priority: "High",
    dueDate: null,
    eventId: null,
    relativeOffsetDays: null,
  };

  it("renders a task card with its title", () => {
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={[task]} />);
    expect(screen.getByText("Write tests")).toBeInTheDocument();
  });

  it("calls onTaskClick with the task when a card is clicked", () => {
    const onTaskClick = jest.fn();
    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[task]}
        onTaskClick={onTaskClick}
      />,
    );
    fireEvent.click(screen.getByText("Write tests"));
    expect(onTaskClick).toHaveBeenCalledWith(task);
  });

  it("renders the 'Schedule →' hover label (initially invisible via opacity-0)", () => {
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={[task]} />);
    expect(screen.getByText("Schedule →")).toBeInTheDocument();
  });

  it("applies hover styles on mouseEnter and resets on mouseLeave", () => {
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={[task]} />);
    const card = screen.getByText("Write tests").closest("div.group")!;
    fireEvent.mouseEnter(card);
    expect(card).toHaveStyle({ background: "rgba(148,163,255,0.06)" });
    fireEvent.mouseLeave(card);
    expect(card).toHaveStyle({ background: "rgba(255,255,255,0.02)" });
  });

  // Priority badge colours
  it.each([
    ["High", "bg-red-500/15"],
    ["Medium", "bg-orange-400/15"],
    ["Low", "bg-green-400/10"],
  ])("renders correct priority badge class for %s", (priority, cls) => {
    const t = { ...task, priority };
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={[t]} />);
    const badge = screen.getByText(priority);
    expect(badge.className).toContain(cls);
  });

  it("renders the category badge and coloured top stripe when task has a linked category", () => {
    const event = { id: "e1", category: "Work", start: NOW.toISOString() };
    const category = { name: "Work", color: "#ff0000" };
    const taskWithEvent = { ...task, eventId: "e1" };

    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[taskWithEvent]}
        events={[event]}
        categories={[category]}
      />,
    );

    expect(screen.getByText("Work")).toBeInTheDocument();
    const stripe = document.querySelector("div.h-0\\.5");
    expect(stripe).toBeInTheDocument();
    expect(stripe).toHaveStyle({ backgroundColor: "#ff0000" });
  });

  it("does NOT render the category badge when there is no linked event", () => {
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={[task]} />);
    expect(screen.queryByText("Work")).not.toBeInTheDocument();
  });

  it("applies tag-coloured hover styles when the task has a linked category", () => {
    const event = { id: "e1", category: "Work", start: NOW.toISOString() };
    const category = { name: "Work", color: "#aabbcc" };
    const taskWithEvent = { ...task, eventId: "e1" };

    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[taskWithEvent]}
        events={[event]}
        categories={[category]}
      />,
    );
    const card = screen.getByText("Write tests").closest("div.group")!;
    fireEvent.mouseEnter(card);
    expect(card).toHaveStyle({ background: "#aabbcc18" });
    fireEvent.mouseLeave(card);
    expect(card).toHaveStyle({ background: "rgba(255,255,255,0.02)" });
  });

  it("renders multiple task cards", () => {
    const tasks = [
      { ...task, id: "t1", title: "Task One" },
      { ...task, id: "t2", title: "Task Two" },
    ];
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={tasks} />);
    expect(screen.getByText("Task One")).toBeInTheDocument();
    expect(screen.getByText("Task Two")).toBeInTheDocument();
  });
});

// DeadlineBadge — dueDate branch

describe("DeadlineBadge — dueDate branch", () => {
  const makeTask = (dueDate: Date) => ({
    id: "t1",
    title: "T",
    priority: "Low",
    dueDate: dueDate.toISOString(),
    eventId: null,
    relativeOffsetDays: null,
  });

  it("shows 'Due <date>' with no suffix when due date is far away (> 3 days)", () => {
    const due = daysFromNow(10);
    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(due)]}
      />,
    );
    const badge = screen.getByText(/Due/);
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).not.toContain("d left");
    expect(badge.textContent).not.toContain("⚠️");
  });

  it("shows urgency and '· <N>d left' when due in 1–3 days", () => {
    const due = daysFromNow(2);
    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(due)]}
      />,
    );
    const badge = screen.getByText(/⚠️/);
    expect(badge.textContent).toContain("2d left");
    expect(badge).toHaveStyle({ color: "#f87171" });
  });

  it("shows '· today' when due date is today (daysLeft === 0)", () => {
    const due = new Date(NOW.getTime() - 1);
    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(due)]}
      />,
    );
    expect(screen.getByText(/today/)).toBeInTheDocument();
  });

  it("shows '· overdue' when due date is in the past", () => {
    const due = daysFromNow(-5);
    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(due)]}
      />,
    );
    expect(screen.getByText(/overdue/)).toBeInTheDocument();
  });

  it("uses muted colour for non-urgent due dates", () => {
    const due = daysFromNow(10);
    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(due)]}
      />,
    );
    const badge = screen.getByText(/Due/);
    expect(badge).toHaveStyle({ color: "rgba(148,163,255,0.5)" });
  });

  it("calls format() with 'MMM d, yyyy' for dueDate", () => {
    const due = daysFromNow(10);
    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(due)]}
      />,
    );
    expect(format).toHaveBeenCalledWith(expect.any(Date), "MMM d, yyyy");
  });
});

// DeadlineBadge — eventId / relativeOffsetDays branch

describe("DeadlineBadge — eventId branch", () => {
  const eventStart = daysFromNow(20);
  const event = {
    id: "e1",
    category: "Work",
    start: eventStart.toISOString(),
  };
  const makeTask = (relativeOffsetDays: number) => ({
    id: "t1",
    title: "T",
    priority: "Low",
    dueDate: null,
    eventId: "e1",
    relativeOffsetDays,
  });

  it("shows 'Finish by <date>' using getNextOccurrenceDeadline when it returns a date", () => {
    const deadline = daysFromNow(5);
    mockGetNextOccurrenceDeadline.mockReturnValue(deadline);

    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(0)]}
        events={[event]}
      />,
    );
    expect(screen.getByText(/Finish by/)).toBeInTheDocument();
  });

  it("falls back to event.start + relativeOffsetDays when getNextOccurrenceDeadline returns null", () => {
    mockGetNextOccurrenceDeadline.mockReturnValue(null);

    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(5)]}
        events={[event]}
      />,
    );
    expect(screen.getByText(/Finish by/)).toBeInTheDocument();
  });

  it("shows urgency when deadline from eventId branch is within 3 days", () => {
    const deadline = daysFromNow(2);
    mockGetNextOccurrenceDeadline.mockReturnValue(deadline);

    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(0)]}
        events={[event]}
      />,
    );
    expect(screen.getByText(/⚠️/)).toBeInTheDocument();
  });

  it("shows '· today' in eventId branch when daysLeft is 0", () => {
    const deadline = new Date(NOW.getTime() - 1);
    mockGetNextOccurrenceDeadline.mockReturnValue(deadline);

    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(0)]}
        events={[event]}
      />,
    );
    expect(screen.getByText(/today/)).toBeInTheDocument();
  });

  it("shows '· overdue' in eventId branch when deadline is past", () => {
    const deadline = daysFromNow(-3);
    mockGetNextOccurrenceDeadline.mockReturnValue(deadline);

    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(0)]}
        events={[event]}
      />,
    );
    expect(screen.getByText(/overdue/)).toBeInTheDocument();
  });

  it("falls back to 'No deadline' when eventId is set but event is not found in events list", () => {
    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(0)]}
        events={[]}
      />,
    );
    expect(screen.getByText("No deadline")).toBeInTheDocument();
  });

  it("passes the linked event and relativeOffsetDays to getNextOccurrenceDeadline", () => {
    mockGetNextOccurrenceDeadline.mockReturnValue(daysFromNow(10));

    render(
      <UnscheduledPanel
        {...baseProps}
        unscheduledTasks={[makeTask(3)]}
        events={[event]}
      />,
    );
    expect(mockGetNextOccurrenceDeadline).toHaveBeenCalledWith(
      event,
      3,
      expect.any(Date),
    );
  });
});

// DeadlineBadge — no deadline branch

describe("DeadlineBadge — no deadline", () => {
  it("renders 'No deadline' when task has no dueDate and no eventId", () => {
    const task = {
      id: "t1",
      title: "T",
      priority: "Low",
      dueDate: null,
      eventId: null,
      relativeOffsetDays: null,
    };
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={[task]} />);
    expect(screen.getByText("No deadline")).toBeInTheDocument();
  });

  it("renders 'No deadline' with muted italic styling", () => {
    const task = {
      id: "t1",
      title: "T",
      priority: "Low",
      dueDate: null,
      eventId: null,
      relativeOffsetDays: null,
    };
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={[task]} />);
    const badge = screen.getByText("No deadline");
    expect(badge.className).toContain("italic");
    expect(badge).toHaveStyle({ color: "rgba(148,163,255,0.35)" });
  });
});

// Schedule Log

describe("UnscheduledPanel — schedule log", () => {
  const dayLog = {
    id: "log1",
    mode: "day",
    scheduledAt: new Date("2024-06-10T09:00:00.000Z").toISOString(),
    dateLabel: "June 10, 2024",
    taskIds: ["t1", "t2"],
  };

  const weekLog = {
    id: "log2",
    mode: "week",
    scheduledAt: new Date("2024-06-12T14:30:00.000Z").toISOString(),
    dateLabel: "Week of June 10",
    taskIds: ["t3"],
  };

  it("renders a log entry with its dateLabel", () => {
    render(<UnscheduledPanel {...baseProps} scheduleLogs={[dayLog]} />);
    expect(screen.getByText("June 10, 2024")).toBeInTheDocument();
  });

  it("renders 'Day' badge for mode=day", () => {
    render(<UnscheduledPanel {...baseProps} scheduleLogs={[dayLog]} />);
    expect(screen.getByText("Day")).toBeInTheDocument();
  });

  it("renders 'Week' badge for mode=week", () => {
    render(<UnscheduledPanel {...baseProps} scheduleLogs={[weekLog]} />);
    expect(screen.getByText("Week")).toBeInTheDocument();
  });

  it("renders correct task count text (plural)", () => {
    render(<UnscheduledPanel {...baseProps} scheduleLogs={[dayLog]} />);
    expect(screen.getByText("2 tasks")).toBeInTheDocument();
  });

  it("renders correct task count text (singular)", () => {
    render(<UnscheduledPanel {...baseProps} scheduleLogs={[weekLog]} />);
    expect(screen.getByText("1 task")).toBeInTheDocument();
  });

  it("renders Edit and Delete buttons for each log", () => {
    render(
      <UnscheduledPanel {...baseProps} scheduleLogs={[dayLog, weekLog]} />,
    );
    expect(screen.getAllByText("Edit")).toHaveLength(2);
    expect(screen.getAllByText("Delete")).toHaveLength(2);
  });

  it("calls onEditLog with the log when Edit is clicked", () => {
    const onEditLog = jest.fn();
    render(
      <UnscheduledPanel
        {...baseProps}
        scheduleLogs={[dayLog]}
        onEditLog={onEditLog}
      />,
    );
    fireEvent.click(screen.getByText("Edit"));
    expect(onEditLog).toHaveBeenCalledWith(dayLog);
  });

  it("calls onDeleteLog with the log id when Delete is clicked", () => {
    const onDeleteLog = jest.fn();
    render(
      <UnscheduledPanel
        {...baseProps}
        scheduleLogs={[dayLog]}
        onDeleteLog={onDeleteLog}
      />,
    );
    fireEvent.click(screen.getByText("Delete"));
    expect(onDeleteLog).toHaveBeenCalledWith("log1");
  });

  it("calls format() with 'MMM d, h:mm a' for scheduledAt", () => {
    render(<UnscheduledPanel {...baseProps} scheduleLogs={[dayLog]} />);
    expect(format).toHaveBeenCalledWith(
      expect.any(Date),
      "MMM d, h:mm a",
    );
  });

  it("applies 'day' badge styles (bg-[rgba(220,225,255,0.1)]) for mode=day", () => {
    render(<UnscheduledPanel {...baseProps} scheduleLogs={[dayLog]} />);
    const badge = screen.getByText("Day");
    expect(badge.className).toContain("bg-[rgba(220,225,255,0.1)]");
  });

  it("applies 'week' badge styles (bg-[rgba(148,163,255,0.15)]) for mode=week", () => {
    render(<UnscheduledPanel {...baseProps} scheduleLogs={[weekLog]} />);
    const badge = screen.getByText("Week");
    expect(badge.className).toContain("bg-[rgba(148,163,255,0.15)]");
  });
});