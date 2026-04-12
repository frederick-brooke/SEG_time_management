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

jest.mock("@/context/UIContext", () => ({
  useUI: () => ({
    setIsModalOpen: jest.fn(),
  }),
}));

import { getNextOccurrenceDeadline } from "@/lib/scheduling/taskSchedulingUtils";
const mockGetNextOccurrenceDeadline = getNextOccurrenceDeadline as jest.Mock;

// Shared Fixtures & Setup 

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

// Test Suites 

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

  it("applies hover styles on mouseEnter and resets on mouseLeave", () => {
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={[task]} />);
    const card = screen.getByText("Write tests").closest("div.group")!;
    fireEvent.mouseEnter(card);
    expect(card).toHaveStyle({ background: "rgba(147,197,253,0.08)" });
    fireEvent.mouseLeave(card);
    expect(card).toHaveStyle({ background: "rgba(255,255,255,0.02)" });
  });

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

  it("applies blue-hover styles even when the task has a linked category", () => {
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
    expect(card).toHaveStyle({ background: "rgba(147,197,253,0.08)" });
  });
});

describe("DeadlineBadge — states", () => {
  const makeTask = (dueDate: Date) => ({
    id: "t1",
    title: "T",
    priority: "Low",
    dueDate: dueDate.toISOString(),
    eventId: null,
    relativeOffsetDays: null,
  });

  it("shows urgency and '· <N>d left' when due in 1–3 days", () => {
    const due = daysFromNow(2);
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={[makeTask(due)]} />);
    const badge = screen.getByText(/⚠️/);
    expect(badge.textContent).toContain("2d left");
    expect(badge).toHaveStyle({ color: "#f87171" });
  });

  it("uses Blue-300 muted colour for non-urgent due dates", () => {
    const due = daysFromNow(10);
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={[makeTask(due)]} />);
    const badge = screen.getByText(/Due/);
    expect(badge).toHaveStyle({ color: "rgba(148,163,255,0.5)" });
  });

  it("renders 'No deadline' with Blue-300 muted italic styling", () => {
    const task = { id: "t1", title: "T", priority: "Low", dueDate: null, eventId: null, relativeOffsetDays: null };
    render(<UnscheduledPanel {...baseProps} unscheduledTasks={[task]} />);
    const badge = screen.getByText("No deadline");
    expect(badge.className).toContain("italic");
    expect(badge).toHaveStyle({ color: "rgba(148,163,255,0.35)" });
  });
});

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

  it("applies 'day' badge styles for mode=day", () => {
    render(<UnscheduledPanel {...baseProps} scheduleLogs={[dayLog]} />);
    const badge = screen.getByText("Day");
    expect(badge.className).toContain("bg-[rgba(220,225,255,0.1)]");
  });

  it("applies 'week' badge styles with Blue-300 values for mode=week", () => {
    render(<UnscheduledPanel {...baseProps} scheduleLogs={[weekLog]} />);
    const badge = screen.getByText("Week");
    expect(badge.className).toContain("bg-[rgba(147,197,253,0.15)]");
  });

  it("calls onDeleteLog with the log id when Delete is clicked", () => {
    const onDeleteLog = jest.fn();
    render(<UnscheduledPanel {...baseProps} scheduleLogs={[dayLog]} onDeleteLog={onDeleteLog} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(onDeleteLog).toHaveBeenCalledWith("log1");
  });
});