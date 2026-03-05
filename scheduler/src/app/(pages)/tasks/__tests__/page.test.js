import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TasksPage from "../page";
import { useSession } from "next-auth/react";
import { useTasks } from "@/src/hooks/useTasks";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock next/navigation redirect (in case your page uses it when unauthenticated)
const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args) => mockRedirect(...args),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// Mock the useTasks hook (used by ToDoList, which your page renders)
jest.mock("@/src/hooks/useTasks", () => ({
  useTasks: jest.fn(),
}));

describe("Tasks Page", () => {
  const mockSession = {
    user: {
      id: "user123",
      email: "test@example.com",
      name: "Test User",
    },
  };

  const mockTasks = [
    {
      id: "task1",
      title: "Task 1",
      description: "Description 1",
      dueDate: "2024-12-31T00:00:00.000Z",
      status: "todo",
      priority: "High",
      duration: 60,
      subtasks: ["subtask1"],
      completed: false,
    },
    {
      id: "task2",
      title: "Task 2",
      description: "Description 2",
      dueDate: "2024-12-25T00:00:00.000Z",
      status: "in-progress",
      priority: "Medium",
      duration: 30,
      subtasks: [],
      completed: false,
    },
  ];

  const mockUseTasks = {
    tasks: mockTasks,
    isLoading: false,
    isDialogOpen: false,
    setIsDialogOpen: jest.fn(),
    editingTaskId: null,
    formData: {
      name: "",
      description: "",
      dueDate: "",
      subtasks: "",
      durationHours: "0",
      durationMinutes: "0",
      priority: "Low",
    },
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedirect.mockClear();

    // Default: authenticated
    useSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
    });

    // Default: ToDoList has tasks loaded
    useTasks.mockReturnValue(mockUseTasks);
  });

  // ✅ Covers: if (status === "loading") return <p>Loading...</p>
  it("renders session loading state (page-level loading branch)", () => {
    useSession.mockReturnValue({
      data: null,
      status: "loading",
    });

    render(<TasksPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("handles unauthenticated state (no session / no session.user) without rendering the authenticated page UI", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<TasksPage />);

    // If unauthenticated, the main authenticated content should NOT be shown.
    expect(screen.queryByText("TO DO LIST")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Get ahead of your tasks!"),
    ).not.toBeInTheDocument();
  });

  it("renders tasks page with title", () => {
    render(<TasksPage />);
    expect(screen.getByText("TO DO LIST")).toBeInTheDocument();
    expect(screen.getByText("Get ahead of your tasks!")).toBeInTheDocument();
  });

  it("displays progress bar with correct percentage", () => {
    render(<TasksPage />);
    // 0 completed out of 2 tasks = 0%
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders Sort and New buttons", () => {
    render(<TasksPage />);
    expect(screen.getByText("Sort")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("displays tasks in correct columns", () => {
    render(<TasksPage />);
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
  });

  it("calls sortTasks when Sort button is clicked", () => {
    render(<TasksPage />);
    const sortButton = screen.getByText("Sort");
    fireEvent.click(sortButton);
    expect(mockUseTasks.sortTasks).toHaveBeenCalled();
  });

  it("shows empty state when no tasks", () => {
    useTasks.mockReturnValue({
      ...mockUseTasks,
      tasks: [],
    });

    render(<TasksPage />);
    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();
  });

  it("calls toggleTaskStatus when checkbox is clicked", () => {
    render(<TasksPage />);
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(mockUseTasks.toggleTaskStatus).toHaveBeenCalledWith(
      "task1",
      "completed",
    );
  });

  it("shows task form dialog when New button is clicked", () => {
    useTasks.mockReturnValue({
      ...mockUseTasks,
      isDialogOpen: true,
    });

    render(<TasksPage />);
    expect(screen.getByText("Create New Task")).toBeInTheDocument();
  });
});
