import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToDoList } from "../../to-do-list";

const mockUseTasks = jest.fn();
jest.mock("@/src/hooks/useTasks", () => ({
  useTasks: (...args) => mockUseTasks(...args),
}));

/**
 * NOTE:
 * Your real UI components (Card/Button/Progress) are being rendered by Jest (as seen in your DOM output),
 * so we DO NOT rely on a Progress mock + data-testid="progress".
 * We assert against role="progressbar" + the visible percentage text instead.
 */

// these are imported by src/components/to-do-list.jsx as "./tasks/..."
jest.mock("../../tasks/TaskColumn", () => ({
  TaskColumn: ({
    title,
    tasks,
    status,
    getPriorityStyle,
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
          <button type="button" onClick={() => onToggle(tasks[0].id)}>
            toggle-first
          </button>
          <button type="button" onClick={() => onView(tasks[0])}>
            view-first
          </button>
          <button type="button" onClick={() => onEdit(tasks[0].id)}>
            edit-first
          </button>
          <button type="button" onClick={() => onDelete(tasks[0].id)}>
            delete-first
          </button>
        </div>
      ) : null}
    </div>
  ),
}));

jest.mock("../../tasks/TaskFormDialog", () => ({
  TaskFormDialog: ({ isOpen, onOpenChange, onSubmit }) => (
    <div data-testid="task-form-dialog">
      <div data-testid="form-open">{String(isOpen)}</div>
      <button type="button" onClick={() => onOpenChange(true)}>
        open-form
      </button>
      <button type="button" onClick={() => onOpenChange(false)}>
        close-form
      </button>
      <button type="button" onClick={onSubmit}>
        submit-form
      </button>
    </div>
  ),
}));

jest.mock("../../tasks/TaskViewDialog", () => ({
  TaskViewDialog: ({ task, isOpen, onClose }) => (
    <div data-testid="task-view-dialog">
      <div data-testid="view-open">{String(isOpen)}</div>
      <div data-testid="view-title">{task ? task.title : ""}</div>
      <button type="button" onClick={onClose}>
        close-view
      </button>
    </div>
  ),
}));

jest.mock("../../tasks/DeleteTaskDialog", () => ({
  DeleteTaskDialog: ({ isOpen, onConfirm, onCancel }) => (
    <div data-testid="delete-task-dialog">
      <div data-testid="delete-open">{String(isOpen)}</div>
      <button type="button" onClick={onConfirm}>
        confirm-delete
      </button>
      <button type="button" onClick={onCancel}>
        cancel-delete
      </button>
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

    // Progress logic validated via visible percentage text + existence of progressbar
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

    // Progress logic validated via visible percentage text + existence of progressbar
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Cover getPriorityStyle switch via rendered outputs
    const priorityOutputs = screen
      .getAllByTestId(/priority-/)
      .map((n) => n.textContent)
      .join(" ");

    expect(priorityOutputs).toMatch(/bg-red-100/);
    expect(priorityOutputs).toMatch(/bg-amber-100/);
    expect(priorityOutputs).toMatch(/bg-emerald-100/);
    expect(priorityOutputs).toMatch(/bg-slate-100/);

    fireEvent.click(screen.getByRole("button", { name: "Sort" }));
    expect(sortTasks).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "open-form" }));
    expect(setIsDialogOpen).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole("button", { name: "close-form" }));
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

    // Only "Hello" should remain after search filter
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

    // Should fall back to "todo" bucket
    expect(screen.getByTestId("count-todo")).toHaveTextContent("1");
    expect(screen.getByTestId("count-in-progress")).toHaveTextContent("0");
    expect(screen.getByTestId("count-completed")).toHaveTextContent("0");
  });
});
