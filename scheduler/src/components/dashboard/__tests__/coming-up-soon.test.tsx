import React from "react";
import { render, screen } from "@testing-library/react";
import { ComingUpSoon } from "../coming-up-soon"; 
import { useTasks } from "@/hooks/useTasks";

// 1. Mock External Dependencies 

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

jest.mock("../../tasks/TaskForm", () => ({
  TaskForm: () => <div data-testid="task-form">Task Form</div>,
}));

jest.mock("../../tasks/TaskViewDialog", () => ({
  TaskViewDialog: ({ isOpen, task }: { isOpen: boolean; task: any }) =>
    isOpen ? <div data-testid="task-view-dialog">{task.title}</div> : null,
}));

jest.mock("../../tasks/DeleteTaskDialog", () => ({
  DeleteTaskDialog: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="delete-dialog">Delete Dialog</div> : null,
}));

describe("ComingUpSoon Component", () => {
  const mockUseTasks = useTasks as jest.Mock;

  // Helper to dynamically generate dates so tests never expire
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

  // 2. Loading & Empty States 

  it("renders loading state when isLoading is true", () => {
    mockUseTasks.mockReturnValue({ ...defaultMockReturn, isLoading: true });
    render(<ComingUpSoon userId="user-1" />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Coming Up Soon")).not.toBeInTheDocument();
  });

  it("renders empty state when there are no tasks", () => {
    mockUseTasks.mockReturnValue({ ...defaultMockReturn, tasks: [] });
    render(<ComingUpSoon userId="user-1" />);

    expect(screen.getByText("No tasks due soon")).toBeInTheDocument();
  });

  // 3. Filtering & Sorting Logic 

  it("filters out completed tasks and tasks outside the 7-day window", () => {
    const mockTasks = [
      { id: "1", title: "Due Today", dueDate: today.toISOString(), status: "pending" },
      { id: "2", title: "Due Tomorrow", dueDate: tomorrow.toISOString(), status: "pending" },
      { id: "3", title: "Completed Today", dueDate: today.toISOString(), status: "completed" }, // Should hide
      { id: "4", title: "Due Next Month", dueDate: nextMonth.toISOString(), status: "pending" }, // Should hide
      { id: "5", title: "Due Yesterday", dueDate: yesterday.toISOString(), status: "pending" }, // Should hide
    ];

    mockUseTasks.mockReturnValue({ ...defaultMockReturn, tasks: mockTasks });
    render(<ComingUpSoon userId="user-1" />);

    // Should render
    expect(screen.getByTestId("task-card-1")).toBeInTheDocument();
    expect(screen.getByTestId("task-card-2")).toBeInTheDocument();

    // Should NOT render
    expect(screen.queryByTestId("task-card-3")).not.toBeInTheDocument();
    expect(screen.queryByTestId("task-card-4")).not.toBeInTheDocument();
    expect(screen.queryByTestId("task-card-5")).not.toBeInTheDocument();
  });

  it("sorts tasks by due date in ascending order", () => {
    const mockTasks = [
      { id: "1", title: "Due Next Week", dueDate: nextWeek.toISOString(), status: "pending" },
      { id: "2", title: "Due Today", dueDate: today.toISOString(), status: "pending" },
      { id: "3", title: "Due Tomorrow", dueDate: tomorrow.toISOString(), status: "pending" },
    ];

    mockUseTasks.mockReturnValue({ ...defaultMockReturn, tasks: mockTasks });
    render(<ComingUpSoon userId="user-1" />);

    // Query all rendered task cards
    const renderedTasks = screen.getAllByTestId(/task-card-/);
    
    // Check if they are rendered in chronological order
    expect(renderedTasks[0]).toHaveTextContent("Due Today");
    expect(renderedTasks[1]).toHaveTextContent("Due Tomorrow");
    expect(renderedTasks[2]).toHaveTextContent("Due Next Week");
  });

  // 4. Dialog Integration 

  it("passes the correct state to the DeleteTaskDialog", () => {
    mockUseTasks.mockReturnValue({
      ...defaultMockReturn,
      taskToDelete: { id: "1", title: "Task to delete" },
    });
    render(<ComingUpSoon userId="user-1" />);

    expect(screen.getByTestId("delete-dialog")).toBeInTheDocument();
  });

  it("passes the correct state to the TaskViewDialog", () => {
    mockUseTasks.mockReturnValue({
      ...defaultMockReturn,
      viewTask: { id: "1", title: "Task to view" },
    });
    render(<ComingUpSoon userId="user-1" />);

    expect(screen.getByTestId("task-view-dialog")).toBeInTheDocument();
    expect(screen.getByText("Task to view")).toBeInTheDocument();
  });
});