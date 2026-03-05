import { render, screen, fireEvent } from "@testing-library/react";
import { TaskCard } from "../TaskCard";

describe("TaskCard", () => {
  const baseTask = {
    id: "task1",
    title: "Test Task",
    description: "Test Description",
    dueDate: "2024-12-31T00:00:00.000Z",
    status: "todo",
    priority: "High",
    duration: 60,
    subtasks: ["subtask1", "subtask2"],
    completed: false,
  };

  const mockHandlers = {
    onToggle: jest.fn(),
    onView: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  const mockGetPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";
      case "Medium":
        return "bg-amber-100 text-amber-700";
      case "Low":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders task title", () => {
    render(
      <TaskCard
        task={baseTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("displays priority badge with correct styling", () => {
    render(
      <TaskCard
        task={baseTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    const priorityBadge = screen.getByText("High");
    expect(priorityBadge).toBeInTheDocument();
    expect(priorityBadge).toHaveClass("bg-red-100", "text-red-700");
  });

  it("displays due date", () => {
    render(
      <TaskCard
        task={baseTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it("shows duration if present", () => {
    render(
      <TaskCard
        task={baseTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.getByText(/1h 0m/)).toBeInTheDocument();
  });

  it("shows subtasks header when subtasks exist", () => {
    render(
      <TaskCard
        task={baseTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.getByText("Subtasks")).toBeInTheDocument();
    expect(screen.getByText("subtask1")).toBeInTheDocument();
    expect(screen.getByText("subtask2")).toBeInTheDocument();
  });

  it("calls onToggle when main checkbox is clicked (todo -> completed)", () => {
    render(
      <TaskCard
        task={baseTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    const checkbox = document.getElementById("task-task1");
    fireEvent.click(checkbox);

    expect(mockHandlers.onToggle).toHaveBeenCalledWith("task1", "completed");
  });

  // ✅ NEW: covers branch `task.status === "completed" ? "todo" : "completed"`
  it("calls onToggle with todo when main checkbox is clicked on a completed task (completed -> todo)", () => {
    const completedTask = { ...baseTask, status: "completed" };

    render(
      <TaskCard
        task={completedTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    const checkbox = document.getElementById("task-task1");
    fireEvent.click(checkbox);

    expect(mockHandlers.onToggle).toHaveBeenCalledWith("task1", "todo");
  });

  it("calls onView when view button is clicked", () => {
    render(
      <TaskCard
        task={baseTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    const viewButton = screen.getByTitle("View Task");
    fireEvent.click(viewButton);

    expect(mockHandlers.onView).toHaveBeenCalledWith(baseTask);
  });

  it("calls onEdit when edit button is clicked", () => {
    render(
      <TaskCard
        task={baseTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    const editButton = screen.getByTitle("Edit Task");
    fireEvent.click(editButton);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith("task1");
  });

  it("calls onDelete when delete button is clicked", () => {
    render(
      <TaskCard
        task={baseTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    const deleteButton = screen.getByTitle("Delete Task");
    fireEvent.click(deleteButton);

    expect(mockHandlers.onDelete).toHaveBeenCalledWith("task1");
  });

  it("renders task without duration", () => {
    const taskWithoutDuration = { ...baseTask, duration: 0 };

    render(
      <TaskCard
        task={taskWithoutDuration}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.queryByText(/1h 0m/)).not.toBeInTheDocument();
  });

  it("renders task without subtasks when subtasks is empty array", () => {
    const taskWithoutSubtasks = { ...baseTask, subtasks: [] };

    render(
      <TaskCard
        task={taskWithoutSubtasks}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.queryByText("Subtasks")).not.toBeInTheDocument();
  });

  // ✅ NEW: covers `if (!task.subtasks) return [];`
  it("handles missing subtasks (subtasks undefined) without rendering subtasks section", () => {
    const taskMissingSubtasks = { ...baseTask };
    delete taskMissingSubtasks.subtasks;

    render(
      <TaskCard
        task={taskMissingSubtasks}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.queryByText("Subtasks")).not.toBeInTheDocument();
  });

  it("renders different priority levels correctly", () => {
    const mediumTask = { ...baseTask, priority: "Medium" };
    const { rerender } = render(
      <TaskCard
        task={mediumTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.getByText("Medium")).toHaveClass(
      "bg-amber-100",
      "text-amber-700",
    );

    const lowTask = { ...baseTask, priority: "Low" };
    rerender(
      <TaskCard
        task={lowTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.getByText("Low")).toHaveClass(
      "bg-emerald-100",
      "text-emerald-700",
    );
  });

  it("handles subtasks as comma-separated string", () => {
    const taskWithStringSubtasks = {
      ...baseTask,
      subtasks: "subtask1, subtask2, subtask3",
    };

    render(
      <TaskCard
        task={taskWithStringSubtasks}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.getByText("subtask1")).toBeInTheDocument();
    expect(screen.getByText("subtask2")).toBeInTheDocument();
    expect(screen.getByText("subtask3")).toBeInTheDocument();
  });

  it("initializes subtask checkboxes as checked when task is completed", () => {
    const completedTask = {
      ...baseTask,
      status: "completed",
      subtasks: ["subtask1", "subtask2"],
    };

    render(
      <TaskCard
        task={completedTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it("calls onToggle when drag handle is clicked", () => {
    render(
      <TaskCard
        task={baseTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    const dragHandle = screen.getByText("⋮⋮").closest("button");
    fireEvent.click(dragHandle);

    expect(mockHandlers.onToggle).toHaveBeenCalledWith("task1");
  });

  it("handles subtask as object with title property", () => {
    const taskWithObjectSubtasks = {
      ...baseTask,
      subtasks: [{ title: "Object subtask 1" }, { title: "Object subtask 2" }],
    };

    render(
      <TaskCard
        task={taskWithObjectSubtasks}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.getByText("Object subtask 1")).toBeInTheDocument();
    expect(screen.getByText("Object subtask 2")).toBeInTheDocument();
  });

  it("marks task as completed when all subtasks are checked", () => {
    const taskWithSubtasks = {
      ...baseTask,
      status: "in-progress",
      subtasks: ["subtask1", "subtask2"],
    };

    render(
      <TaskCard
        task={taskWithSubtasks}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    expect(mockHandlers.onToggle).toHaveBeenCalledWith("task1", "completed");
  });

  it("marks task as in-progress when unchecking subtask of completed task", () => {
    const completedTask = {
      ...baseTask,
      status: "completed",
      subtasks: ["subtask1", "subtask2"],
    };

    render(
      <TaskCard
        task={completedTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);

    expect(mockHandlers.onToggle).toHaveBeenCalledWith("task1", "in-progress");
  });

  it("renders completed task with line-through styling", () => {
    const completedTask = { ...baseTask, status: "completed" };

    render(
      <TaskCard
        task={completedTask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    const title = screen.getByText("Test Task");
    expect(title).toHaveClass("line-through");
  });

  it("renders task without dueDate", () => {
    const taskWithoutDueDate = { ...baseTask, dueDate: null };

    render(
      <TaskCard
        task={taskWithoutDueDate}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  it("handles subtask object without title property", () => {
    const taskWithBadSubtask = { ...baseTask, subtasks: [{ noTitle: true }] };

    render(
      <TaskCard
        task={taskWithBadSubtask}
        {...mockHandlers}
        getPriorityStyle={mockGetPriorityStyle}
      />,
    );

    expect(screen.getByText("New Subtask")).toBeInTheDocument();
  });
});
