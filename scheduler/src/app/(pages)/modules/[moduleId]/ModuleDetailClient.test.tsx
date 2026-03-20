import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ModuleDetailClient from "@/app/(pages)/modules/[moduleId]/ModuleDetailClient";

//mocks
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

jest.mock("next/link", () => ({ children, href }: any) => <a href={href}>{children}</a>);

jest.mock("@/app/actions/module", () => ({
  leaveModule: jest.fn().mockResolvedValue({ success: true }),
  createModuleTask: jest.fn().mockResolvedValue({ success: true }),
  updateModuleTask: jest.fn().mockResolvedValue({ success: true }),
  deleteModuleTask: jest.fn().mockResolvedValue({ success: true }),
  updateModuleEvent: jest.fn().mockResolvedValue({ success: true }),
  deleteModuleEvent: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("@/components/tasks/TaskFormDialog", () => ({
  TaskFormDialog: ({ isOpen, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="task-form">
        <button onClick={onSubmit}>Submit Task</button>
      </div>
    ) : null,
}));

jest.mock("@/components/modules/ModuleEventModal", () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <div data-testid="event-modal">
      <button onClick={onClose}>Close Event Modal</button>
    </div>
  ),
}));

jest.mock("@/lib/format", () => ({
  formatDuration: (m: number) => `${m}m`,
  formatTaskDate: () => "1 Jan 2026",
  formatEventDate: () => "Mon 1 Jan, 09:00",
}));

//constants
const baseModule = {
  id: "mod1",
  name: "CS101",
  description: "Introduction to CS",
  joinPin: "ABC123",
  maxMembers: 50,
  memberCount: 2,
  userRole: "OWNER",
  creator: { username: "prof1" },
  members: [
    {
      id: "mem1", role: "OWNER",
      user: { id: "u1", username: "prof1", fname: "Prof", lname: "One", pfp: null },
    },
    {
      id: "mem2", role: "MEMBER",
      user: { id: "u2", username: "student1", fname: "Alice", lname: "Smith", pfp: null },
    },
  ],
};

const baseEvent = {
  id: "ev1",
  moduleEventGroupId: "grp-ev1",
  title: "Lecture 1",
  description: "First lecture",
  start: new Date("2026-03-15T09:00:00.000Z"),
  end: new Date("2026-03-15T10:00:00.000Z"),
  category: "Lecture",
};

const baseTaskWithProgress = {
  moduleTaskGroupId: "grp-task1",
  title: "Assignment 1",
  description: "First assignment",
  dueDate: new Date("2026-04-01T00:00:00.000Z"),
  priority: "High",
  duration: 60,
  url: null,
  completedMembers: [
    { id: "u2", username: "student1", fname: "Alice", lname: "Smith", pfp: null },
  ],
  inProgressMembers: [
    { id: "u3", username: "student2", fname: "Bob", lname: "Jones", pfp: null },
  ],
  totalAssigned: 2,
};

const memberTask = {
  id: "t1",
  moduleTaskGroupId: "grp-task1",
  title: "Assignment 1",
  description: "First assignment",
  dueDate: new Date("2026-04-01T00:00:00.000Z"),
  priority: "High",
  duration: 60,
  completed: false,
  status: "todo",
};

const ownerProps = {
  module: baseModule,
  events: [baseEvent],
  tasks: [],
  tasksWithProgress: [baseTaskWithProgress],
};

const memberProps = {
  module: { ...baseModule, userRole: "MEMBER", joinPin: null },
  events: [baseEvent],
  tasks: [memberTask],
  tasksWithProgress: [],
};

// ─── Owner view tests ─────────────────────────────────────────────────────────

describe("ModuleDetailClient — owner view", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it("renders the module name and description", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    expect(screen.getByText("CS101")).toBeInTheDocument();
    expect(screen.getByText("Introduction to CS")).toBeInTheDocument();
  });

  it("shows the join PIN for owner", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("shows Create Task and Create Event buttons for owner", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    expect(screen.getByText("Create Task")).toBeInTheDocument();
    expect(screen.getByText("Create Event")).toBeInTheDocument();
  });

  it("does not show Leave Module button for owner", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    expect(screen.queryByText("Leave Module")).not.toBeInTheDocument();
  });

  it("toggles members list open and closed", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    expect(screen.queryByText("@prof1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Members \(2\)/));
    expect(screen.getByText("@prof1")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Members \(2\)/));
    expect(screen.queryByText("@prof1")).not.toBeInTheDocument();
  });

  it("renders the event title and category", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    expect(screen.getByText("Lecture 1")).toBeInTheDocument();
    expect(screen.getByText("Lecture")).toBeInTheDocument();
  });

  it("shows edit and delete buttons on event row for owner", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    expect(screen.getByTitle("Edit event")).toBeInTheDocument();
    expect(screen.getByTitle("Delete event")).toBeInTheDocument();
  });

  it("opens event modal when Create Event is clicked", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    fireEvent.click(screen.getByText("Create Event"));
    expect(screen.getByTestId("event-modal")).toBeInTheDocument();
  });

  it("opens event modal when edit button is clicked", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    fireEvent.click(screen.getByTitle("Edit event"));
    expect(screen.getByTestId("event-modal")).toBeInTheDocument();
  });

  it("calls deleteModuleEvent when delete event button is clicked and confirmed", async () => {
    const { deleteModuleEvent } = require("@/app/actions/module");
    render(<ModuleDetailClient {...ownerProps} />);
    fireEvent.click(screen.getByTitle("Delete event"));
    expect(window.confirm).toHaveBeenCalled();
    await Promise.resolve();
    expect(deleteModuleEvent).toHaveBeenCalledWith("grp-ev1", "mod1");
  });

  it("renders task with progress badges", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    expect(screen.getByText("Assignment 1")).toBeInTheDocument();
    expect(screen.getByText(/1 completed/)).toBeInTheDocument();
    expect(screen.getByText(/1 in progress/)).toBeInTheDocument();
  });

  it("shows completed member names when completed badge is clicked", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    fireEvent.click(screen.getByText(/1 completed/));
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("shows in progress member names when in progress badge is clicked", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    fireEvent.click(screen.getByText(/1 in progress/));
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("shows edit and delete buttons on task row for owner", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    expect(screen.getByTitle("Edit task")).toBeInTheDocument();
    expect(screen.getByTitle("Delete task")).toBeInTheDocument();
  });

  it("opens task form when Create Task is clicked", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    fireEvent.click(screen.getByText("Create Task"));
    expect(screen.getByTestId("task-form")).toBeInTheDocument();
  });

  it("opens task form when edit task button is clicked", () => {
    render(<ModuleDetailClient {...ownerProps} />);
    fireEvent.click(screen.getByTitle("Edit task"));
    expect(screen.getByTestId("task-form")).toBeInTheDocument();
  });

  it("calls deleteModuleTask when delete task button is clicked and confirmed", async () => {
    const { deleteModuleTask } = require("@/app/actions/module");
    render(<ModuleDetailClient {...ownerProps} />);
    fireEvent.click(screen.getByTitle("Delete task"));
    expect(window.confirm).toHaveBeenCalled();
    await Promise.resolve();
    expect(deleteModuleTask).toHaveBeenCalledWith("grp-task1", "mod1");
  });

  it("shows empty state when no tasks", () => {
    render(<ModuleDetailClient {...ownerProps} tasksWithProgress={[]} />);
    expect(screen.getByText(/No tasks assigned yet/)).toBeInTheDocument();
  });

  it("shows empty state when no events", () => {
    render(<ModuleDetailClient {...ownerProps} events={[]} />);
    expect(screen.getByText(/No events scheduled yet/)).toBeInTheDocument();
  });

  it("copies PIN to clipboard when Copy PIN is clicked", () => {
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
    render(<ModuleDetailClient {...ownerProps} />);
    fireEvent.click(screen.getByText("Copy PIN"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("ABC123");
  });
});

// ─── Member view tests ────────────────────────────────────────────────────────

describe("ModuleDetailClient — member view", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it("shows Leave Module button for member", () => {
    render(<ModuleDetailClient {...memberProps} />);
    expect(screen.getByText("Leave Module")).toBeInTheDocument();
  });

  it("does not show Create Task or Create Event for member", () => {
    render(<ModuleDetailClient {...memberProps} />);
    expect(screen.queryByText("Create Task")).not.toBeInTheDocument();
    expect(screen.queryByText("Create Event")).not.toBeInTheDocument();
  });

  it("does not show the PIN for member", () => {
    render(<ModuleDetailClient {...memberProps} />);
    expect(screen.queryByText("ABC123")).not.toBeInTheDocument();
  });

  it("does not show edit or delete on events for member", () => {
    render(<ModuleDetailClient {...memberProps} />);
    expect(screen.queryByTitle("Edit event")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Delete event")).not.toBeInTheDocument();
  });

  it("renders member task in My Tasks section", () => {
    render(<ModuleDetailClient {...memberProps} />);
    expect(screen.getByText("My Tasks")).toBeInTheDocument();
    expect(screen.getByText("Assignment 1")).toBeInTheDocument();
  });

  it("calls leaveModule and redirects when Leave Module is confirmed", async () => {
    const { leaveModule } = require("@/app/actions/module");
    render(<ModuleDetailClient {...memberProps} />);
    fireEvent.click(screen.getByText("Leave Module"));
    await Promise.resolve();
    expect(leaveModule).toHaveBeenCalledWith("mod1");
    expect(mockPush).toHaveBeenCalledWith("/modules");
  });

  it("does not call leaveModule when confirm is cancelled", async () => {
    const { leaveModule } = require("@/app/actions/module");
    window.confirm = jest.fn(() => false);
    render(<ModuleDetailClient {...memberProps} />);
    fireEvent.click(screen.getByText("Leave Module"));
    expect(leaveModule).not.toHaveBeenCalled();
  });
});
