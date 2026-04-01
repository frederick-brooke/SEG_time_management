import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ToDoList } from "../ToDoList";
import { Button } from "@/components/ui/Button";

const mockUseTasks = jest.fn();
jest.mock("@/hooks/useTasks", () => ({
  useTasks: (...args) => mockUseTasks(...args),
}));

jest.mock("../../../hooks/useTaskFilters", () => ({
  useTaskFilters: (tasks, filterExamId, searchQuery) => {
    const filtered = tasks.filter(t =>
      (!searchQuery || (t.title || "").toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return {
      examFilteredTasks: filtered,
      todoTasks: filtered.filter(t => 
        (t.status === "todo" || !t.status) &&
        !(t.dueDate && new Date(t.dueDate) < new Date())
      ),
      inProgressTasks: filtered.filter(t => t.status === "in-progress"),
      completedTasks: filtered.filter(t => t.status === "completed"),
      overdueTasks: filtered.filter(t => t.status === "todo" && t.dueDate && new Date(t.dueDate) < new Date()),
      progressPercentage: tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100)
        : 0,
    };
  },
}));

jest.mock("../../tasks/TaskColumn", () => ({
  TaskColumn: ({
    title,
    tasks,
    status,
    getPriorityStyle = (p: string) => `mock-style-${p}`,
    onToggle,
    onView,
    onEdit,
    onDelete,
  }) => (
    <div data-testid={`column-${status}`}>
      <h2>{title}</h2>
      <div data-testid={`count-${status}`}>{tasks.length}</div>

      {tasks.map((t) => (
        <span key={t.id} data-testid={`priority-${t.id}`}>
          {getPriorityStyle(t.priority)}
        </span>
      ))}

      {tasks[0] ? (
        <div>
          <Button type="button" onClick={() => onToggle(tasks[0].id)}>
            toggle-first
          </Button>
          <Button type="button" onClick={() => onView(tasks[0])}>
            view-first
          </Button>
          <Button type="button" onClick={() => onEdit(tasks[0].id)}>
            edit-first
          </Button>
          <Button type="button" onClick={() => onDelete(tasks[0].id)}>
            delete-first
          </Button>
        </div>
      ) : null}
    </div>
  ),
}));

jest.mock("../TaskForm", () => ({
  TaskForm: ({ isOpen, onOpenChange, onSubmit }) => (
    <div data-testid="task-form-dialog">
      <div data-testid="form-open">{String(isOpen)}</div>
      <Button type="button" onClick={() => onOpenChange(false)}>
        close-form
      </Button>
      <Button type="button" onClick={onSubmit}>
        submit-form
      </Button>
    </div>
  ),
}));

jest.mock("../../tasks/TaskViewDialog", () => ({
  TaskViewDialog: ({ task, isOpen, onClose }) => (
    <div data-testid="task-view-dialog">
      <div data-testid="view-open">{String(isOpen)}</div>
      <div data-testid="view-title">{task ? task.title : ""}</div>
      <Button type="button" onClick={onClose}>
        close-view
      </Button>
    </div>
  ),
}));

jest.mock("../../tasks/DeleteTaskDialog", () => ({
  DeleteTaskDialog: ({ isOpen, onConfirm, onCancel }) => (
    <div data-testid="delete-task-dialog">
      <div data-testid="delete-open">{String(isOpen)}</div>
      <Button type="button" onClick={onConfirm}>
        confirm-delete
      </Button>
      <Button type="button" onClick={onCancel}>
        cancel-delete
      </Button>
    </div>
  ),
}));

function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

describe("ToDoList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    mockUseTasks.mockReturnValue({
      tasks: [],
      isLoading: true,
      isDialogOpen: false,
      setIsDialogOpen: jest.fn(),
      editingTaskId: null,
      formData: {},
      viewTask: null,
      setViewTask: jest.fn(),
      taskToDelete: null,
      toggleTaskStatus: jest.fn(),
      sortTasks: jest.fn(),
      handleFormChange: jest.fn(),
      resetForm: jest.fn(),
      handleSubmitTask: jest.fn(),
      handleEditTask: jest.fn(),
      handleViewTask: jest.fn(),
      handleDeleteTask: jest.fn(),
      confirmDeleteTask: jest.fn(),
      cancelDelete: jest.fn(),
    });

    render(<ToDoList userId="u1" />);
    expect(screen.getByText("Loading tasks...")).toBeInTheDocument();
  });

  it("renders empty state and 0% progress when no tasks", () => {
    mockUseTasks.mockReturnValue({
      tasks: [],
      isLoading: false,
      isDialogOpen: false,
      setIsDialogOpen: jest.fn(),
      editingTaskId: null,
      formData: {},
      viewTask: null,
      setViewTask: jest.fn(),
      taskToDelete: null,
      toggleTaskStatus: jest.fn(),
      sortTasks: jest.fn(),
      handleFormChange: jest.fn(),
      resetForm: jest.fn(),
      handleSubmitTask: jest.fn(),
      handleEditTask: jest.fn(),
      handleViewTask: jest.fn(),
      handleDeleteTask: jest.fn(),
      confirmDeleteTask: jest.fn(),
      cancelDelete: jest.fn(),
    });

    render(<ToDoList userId="u1" />);

    expect(
      screen.getByText(
        /No tasks yet\. Click "New" to create your first task!/i,
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("0%")).toBeInTheDocument();
    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "100");
  });

  it("buckets tasks, computes progress, covers getPriorityStyle branches, and hits resetForm when closing dialog", () => {
    const sortTasks = jest.fn();
    const setIsDialogOpen = jest.fn();
    const resetForm = jest.fn();

    const tasks = [
      {
        id: "t1",
        title: "Overdue",
        status: "todo",
        dueDate: isoDaysFromNow(-2),
        priority: "High",
      },
      {
        id: "t2",
        title: "Todo",
        status: "todo",
        dueDate: null,
        priority: "Medium",
      },
      {
        id: "t3",
        title: "Doing",
        status: "in-progress",
        dueDate: isoDaysFromNow(2),
        priority: "Low",
      },
      {
        id: "t4",
        title: "Done",
        status: "completed",
        dueDate: isoDaysFromNow(-5),
        priority: "WeirdPriority",
      },
    ];

    mockUseTasks.mockReturnValue({
      tasks,
      isLoading: false,
      isDialogOpen: true,
      setIsDialogOpen,
      editingTaskId: null,
      formData: {},
      viewTask: null,
      setViewTask: jest.fn(),
      taskToDelete: null,
      toggleTaskStatus: jest.fn(),
      sortTasks,
      handleFormChange: jest.fn(),
      resetForm,
      handleSubmitTask: jest.fn(),
      handleEditTask: jest.fn(),
      handleViewTask: jest.fn(),
      handleDeleteTask: jest.fn(),
      confirmDeleteTask: jest.fn(),
      cancelDelete: jest.fn(),
    });

    render(<ToDoList userId="u1" />);

    expect(screen.getByTestId("count-overdue")).toHaveTextContent("1");
    expect(screen.getByTestId("count-todo")).toHaveTextContent("1");
    expect(screen.getByTestId("count-in-progress")).toHaveTextContent("1");
    expect(screen.getByTestId("count-completed")).toHaveTextContent("1");

    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    const priorityOutputs = screen
      .getAllByTestId(/priority-/)
      .map((n) => n.textContent)
      .join(" ");

    expect(priorityOutputs).toMatch(/mock-style-High/);
    expect(priorityOutputs).toMatch(/mock-style-Medium/);
    expect(priorityOutputs).toMatch(/mock-style-Low/);
    expect(priorityOutputs).toMatch(/mock-style-WeirdPriority/);

    fireEvent.click(screen.getByRole("button", { name: "Sort" }));
    expect(sortTasks).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("form-open")).toHaveTextContent("true");
    fireEvent.click(screen.getByText("close-form"));
    expect(setIsDialogOpen).toHaveBeenCalledWith(false);
    expect(resetForm).toHaveBeenCalledTimes(1);
  });

  it("filters tasks by search query (case-insensitive)", () => {
    const tasks = [
      {
        id: "a",
        title: "Buy milk",
        status: "todo",
        dueDate: null,
        priority: "Low",
      },
      {
        id: "b",
        title: "Write report",
        status: "in-progress",
        dueDate: isoDaysFromNow(1),
        priority: "High",
      },
      {
        id: "c",
        title: "Read book",
        status: "completed",
        dueDate: isoDaysFromNow(-1),
        priority: "Medium",
      },
    ];

    mockUseTasks.mockReturnValue({
      tasks,
      isLoading: false,
      isDialogOpen: false,
      setIsDialogOpen: jest.fn(),
      editingTaskId: null,
      formData: {},
      viewTask: null,
      setViewTask: jest.fn(),
      taskToDelete: null,
      toggleTaskStatus: jest.fn(),
      sortTasks: jest.fn(),
      handleFormChange: jest.fn(),
      resetForm: jest.fn(),
      handleSubmitTask: jest.fn(),
      handleEditTask: jest.fn(),
      handleViewTask: jest.fn(),
      handleDeleteTask: jest.fn(),
      confirmDeleteTask: jest.fn(),
      cancelDelete: jest.fn(),
    });

    render(<ToDoList userId="u1" />);

    expect(screen.getByTestId("count-todo")).toHaveTextContent("1");
    expect(screen.getByTestId("count-in-progress")).toHaveTextContent("1");
    expect(screen.getByTestId("count-completed")).toHaveTextContent("1");

    fireEvent.change(screen.getByPlaceholderText("Search Tasks"), {
      target: { value: "REPORT" },
    });

    expect(screen.getByTestId("count-todo")).toHaveTextContent("0");
    expect(screen.getByTestId("count-in-progress")).toHaveTextContent("1");
    expect(screen.getByTestId("count-completed")).toHaveTextContent("0");
  });

  it("handles tasks with missing title during search (covers title fallback)", () => {
    const tasks = [
      {
        id: "x",
        title: undefined,
        status: "todo",
        dueDate: null,
        priority: "Low",
      },
      {
        id: "y",
        title: "Hello",
        status: "todo",
        dueDate: null,
        priority: "Low",
      },
    ];

    mockUseTasks.mockReturnValue({
      tasks,
      isLoading: false,
      isDialogOpen: false,
      setIsDialogOpen: jest.fn(),
      editingTaskId: null,
      formData: {},
      viewTask: null,
      setViewTask: jest.fn(),
      taskToDelete: null,
      toggleTaskStatus: jest.fn(),
      sortTasks: jest.fn(),
      handleFormChange: jest.fn(),
      resetForm: jest.fn(),
      handleSubmitTask: jest.fn(),
      handleEditTask: jest.fn(),
      handleViewTask: jest.fn(),
      handleDeleteTask: jest.fn(),
      confirmDeleteTask: jest.fn(),
      cancelDelete: jest.fn(),
    });

    render(<ToDoList userId="u1" />);

    fireEvent.change(screen.getByPlaceholderText("Search Tasks"), {
      target: { value: "hel" },
    });

    expect(screen.getByTestId("count-todo")).toHaveTextContent("1");
  });

  it("opens delete/view dialogs based on taskToDelete/viewTask and closes view via setViewTask(null)", () => {
    const setViewTask = jest.fn();
    const cancelDelete = jest.fn();
    const confirmDeleteTask = jest.fn();

    mockUseTasks.mockReturnValue({
      tasks: [
        {
          id: "t1",
          title: "One",
          status: "todo",
          dueDate: null,
          priority: "Low",
        },
      ],
      isLoading: false,
      isDialogOpen: false,
      setIsDialogOpen: jest.fn(),
      editingTaskId: null,
      formData: {},
      viewTask: { title: "Viewed Task", priority: "High" },
      setViewTask,
      taskToDelete: "t1",
      toggleTaskStatus: jest.fn(),
      sortTasks: jest.fn(),
      handleFormChange: jest.fn(),
      resetForm: jest.fn(),
      handleSubmitTask: jest.fn(),
      handleEditTask: jest.fn(),
      handleViewTask: jest.fn(),
      handleDeleteTask: jest.fn(),
      confirmDeleteTask,
      cancelDelete,
    });

    render(<ToDoList userId="u1" />);

    expect(screen.getByTestId("delete-open")).toHaveTextContent("true");
    fireEvent.click(screen.getByRole("button", { name: "confirm-delete" }));
    expect(confirmDeleteTask).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "cancel-delete" }));
    expect(cancelDelete).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("view-open")).toHaveTextContent("true");
    expect(screen.getByTestId("view-title")).toHaveTextContent("Viewed Task");

    fireEvent.click(screen.getByRole("button", { name: "close-view" }));
    expect(setViewTask).toHaveBeenCalledWith(null);
  });
  it("treats tasks without status as 'todo' (covers status fallback branch)", () => {
    const tasks = [
      {
        id: "nostatus",
        title: "No Status Task",
        // status intentionally missing
        dueDate: null,
        priority: "Low",
      },
    ];

    mockUseTasks.mockReturnValue({
      tasks,
      isLoading: false,
      isDialogOpen: false,
      setIsDialogOpen: jest.fn(),
      editingTaskId: null,
      formData: {},
      viewTask: null,
      setViewTask: jest.fn(),
      taskToDelete: null,
      toggleTaskStatus: jest.fn(),
      sortTasks: jest.fn(),
      handleFormChange: jest.fn(),
      resetForm: jest.fn(),
      handleSubmitTask: jest.fn(),
      handleEditTask: jest.fn(),
      handleViewTask: jest.fn(),
      handleDeleteTask: jest.fn(),
      confirmDeleteTask: jest.fn(),
      cancelDelete: jest.fn(),
    });

    render(<ToDoList userId="u1" />);

    expect(screen.getByTestId("count-todo")).toHaveTextContent("1");
    expect(screen.getByTestId("count-in-progress")).toHaveTextContent("0");
    expect(screen.getByTestId("count-completed")).toHaveTextContent("0");
  });
});
