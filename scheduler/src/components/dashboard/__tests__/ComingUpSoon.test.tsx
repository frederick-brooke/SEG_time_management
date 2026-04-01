//testing for components/dashboard/ComingUpSoon.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ComingUpSoon } from "../ComingUpSoon";
import { useTasks } from "@/hooks/useTasks";

jest.mock("@/hooks/useTasks", () => ({
  useTasks: jest.fn(),
}));

jest.mock("@/lib/priority", () => ({
  getPriorityStyle: jest.fn(),
}));

jest.mock("../../tasks/TaskCard", () => ({
  TaskCard: ({ task }: { task: any }) => (
    <div data-testid={`task-card-${task.id}`}>{task.title}</div>
  ),
}));

// Mock TaskForm with interactive triggers to test the onOpenChange callback coverage
jest.mock("../../tasks/TaskForm", () => ({
  TaskForm: ({ onOpenChange }: any) => (
    <div data-testid="task-form">
      <button data-testid="form-open" onClick={() => onOpenChange(true)}>
        Open Form
      </button>
      <button data-testid="form-close" onClick={() => onOpenChange(false)}>
        Close Form
      </button>
    </div>
  ),
}));

// Mock TaskViewDialog with interactive triggers to test onClose and onEdit callback coverage
jest.mock("../../tasks/TaskViewDialog", () => ({
  TaskViewDialog: ({ isOpen, task, onClose, onEdit }: any) =>
    isOpen ? (
      <div data-testid="task-view-dialog">
        <span>{task.title}</span>
        <button data-testid="dialog-close" onClick={onClose}>
          Close
        </button>
        <button data-testid="dialog-edit" onClick={() => onEdit(task.id)}>
          Edit
        </button>
      </div>
    ) : null,
}));

jest.mock("../../tasks/DeleteTaskDialog", () => ({
  DeleteTaskDialog: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="delete-dialog">Delete Dialog</div> : null,
}));

describe("ComingUpSoon Component", () => {
  const mockUseTasks = useTasks as jest.Mock;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 6);
  const nextMonth = new Date(today);
  nextMonth.setDate(nextMonth.getDate() + 30);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const defaultMockReturn = {
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
    handleFormChange: jest.fn(),
    resetForm: jest.fn(),
    handleSubmitTask: jest.fn(),
    handleEditTask: jest.fn(),
    handleViewTask: jest.fn(),
    handleDeleteTask: jest.fn(),
    confirmDeleteTask: jest.fn(),
    cancelDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Verifies that the component gracefully handles the loading state before tasks are fetched
  it("renders loading state when isLoading is true", () => {
    mockUseTasks.mockReturnValue({ ...defaultMockReturn, isLoading: true });
    render(<ComingUpSoon userId="user-1" />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Coming Up Soon")).not.toBeInTheDocument();
  });

  // Verifies the fallback UI is displayed when no tasks match the upcoming criteria
  it("renders empty state when there are no tasks", () => {
    mockUseTasks.mockReturnValue({ ...defaultMockReturn, tasks: [] });
    render(<ComingUpSoon userId="user-1" />);

    expect(screen.getByText("No tasks due soon")).toBeInTheDocument();
  });

  // Tests the core filtering logic ensuring completed tasks, past tasks, tasks missing dates, and distant tasks are omitted
  it("filters out completed tasks, tasks without dates, and tasks outside the 7-day window", () => {
    const mockTasks = [
      { id: "1", title: "Due Today", dueDate: today.toISOString(), status: "pending" },
      { id: "2", title: "Due Tomorrow", dueDate: tomorrow.toISOString(), status: "pending" },
      { id: "3", title: "Completed Today", dueDate: today.toISOString(), status: "completed" },
      { id: "4", title: "Due Next Month", dueDate: nextMonth.toISOString(), status: "pending" },
      { id: "5", title: "Due Yesterday", dueDate: yesterday.toISOString(), status: "pending" },
      { id: "6", title: "No Due Date", dueDate: null, status: "pending" },
    ];

    mockUseTasks.mockReturnValue({ ...defaultMockReturn, tasks: mockTasks });
    render(<ComingUpSoon userId="user-1" />);

    expect(screen.getByTestId("task-card-1")).toBeInTheDocument();
    expect(screen.getByTestId("task-card-2")).toBeInTheDocument();
    expect(screen.queryByTestId("task-card-3")).not.toBeInTheDocument();
    expect(screen.queryByTestId("task-card-4")).not.toBeInTheDocument();
    expect(screen.queryByTestId("task-card-5")).not.toBeInTheDocument();
    expect(screen.queryByTestId("task-card-6")).not.toBeInTheDocument();
  });

  // Validates that the visual task list displays items strictly in chronological order
  it("sorts tasks by due date in ascending order", () => {
    const mockTasks = [
      { id: "1", title: "Due Next Week", dueDate: nextWeek.toISOString(), status: "pending" },
      { id: "2", title: "Due Today", dueDate: today.toISOString(), status: "pending" },
      { id: "3", title: "Due Tomorrow", dueDate: tomorrow.toISOString(), status: "pending" },
    ];

    mockUseTasks.mockReturnValue({ ...defaultMockReturn, tasks: mockTasks });
    render(<ComingUpSoon userId="user-1" />);

    const renderedTasks = screen.getAllByTestId(/task-card-/);
    
    expect(renderedTasks[0]).toHaveTextContent("Due Today");
    expect(renderedTasks[1]).toHaveTextContent("Due Tomorrow");
    expect(renderedTasks[2]).toHaveTextContent("Due Next Week");
  });

  // Tests the TaskForm onOpenChange callback to ensure it correctly manages dialog state and form resets
  it("handles TaskForm onOpenChange to update dialog state and reset the form", () => {
    mockUseTasks.mockReturnValue(defaultMockReturn);
    render(<ComingUpSoon userId="user-1" />);

    fireEvent.click(screen.getByTestId("form-open"));
    expect(defaultMockReturn.setIsDialogOpen).toHaveBeenCalledWith(true);
    expect(defaultMockReturn.resetForm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("form-close"));
    expect(defaultMockReturn.setIsDialogOpen).toHaveBeenCalledWith(false);
    expect(defaultMockReturn.resetForm).toHaveBeenCalled();
  });

  // Tests the TaskViewDialog callbacks ensuring the view state clears and edit handlers are fired
  it("handles TaskViewDialog onClose and onEdit callbacks appropriately", () => {
    mockUseTasks.mockReturnValue({
      ...defaultMockReturn,
      viewTask: { id: "task-123", title: "Task to view" },
    });
    render(<ComingUpSoon userId="user-1" />);

    fireEvent.click(screen.getByTestId("dialog-close"));
    expect(defaultMockReturn.setViewTask).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByTestId("dialog-edit"));
    expect(defaultMockReturn.setViewTask).toHaveBeenCalledWith(null);
    expect(defaultMockReturn.handleEditTask).toHaveBeenCalledWith("task-123");
  });

  // Confirms the DeleteTaskDialog mounts correctly when a task deletion is initiated
  it("passes the correct state to the DeleteTaskDialog", () => {
    mockUseTasks.mockReturnValue({
      ...defaultMockReturn,
      taskToDelete: { id: "1", title: "Task to delete" },
    });
    render(<ComingUpSoon userId="user-1" />);

    expect(screen.getByTestId("delete-dialog")).toBeInTheDocument();
  });
});