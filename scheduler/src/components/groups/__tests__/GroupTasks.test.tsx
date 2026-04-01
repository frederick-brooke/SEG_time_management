import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupTasks from "@/components/groups/GroupTasks";

// mocks
jest.mock("@/lib/format", () => ({
  formatTaskDate: jest.fn(() => "Nov 1"),
  formatDuration: jest.fn(() => "2h"),
}));

jest.mock("lucide-react", () => ({
  ListTodo: () => <svg data-testid="list-icon" />,
  Pencil: () => <svg data-testid="pencil-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  Circle: () => <svg data-testid="circle-icon" />,
}));

const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockOnToggleComplete = jest.fn();

const mockTasks = [
  {
    groupTaskGroupId: "g-tsk-1",
    title: "Draft Presentation",
    description: "Slides 1-5",
    priority: "High",
    dueDate: new Date("2026-11-01T12:00:00Z"),
    duration: 120,
    currentUserCompleted: false,
    completedMembers: [{ id: "u1", username: "alice", fname: "Alice", lname: "Smith" }],
    inProgressMembers: [{ id: "u2", username: "bob_jones", fname: null, lname: null }],
  },
];

// tests
describe("GroupTasks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirms the component displays a clear empty state when no tasks are provided
  it("renders empty state correctly", () => {
    render(
      <GroupTasks
        tasksWithProgress={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText("Group Tasks (0)")).toBeInTheDocument();
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
  });

  // Confirms fundamental task details (title, priority) are mapped to the UI correctly
  it("renders task details correctly", () => {
    render(
      <GroupTasks
        tasksWithProgress={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText("Draft Presentation")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  // Confirms the progress badges correctly open popovers and handle member name fallbacks
  it("toggles member progress badges and handles name fallbacks", () => {
    render(
      <GroupTasks
        tasksWithProgress={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    fireEvent.click(screen.getByText("1 completed"));
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();

    fireEvent.click(screen.getByText("1 in progress"));
    expect(screen.getByText("bob_jones")).toBeInTheDocument();
  });

  // Confirms the personal completion toggle fires the correct callback with the task object
  it("fires onToggleComplete when clicked", () => {
    render(
      <GroupTasks
        tasksWithProgress={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    fireEvent.click(screen.getByTitle("Mark complete"));
    expect(mockOnToggleComplete).toHaveBeenCalledWith(mockTasks[0]);
  });

  // Confirms management action buttons (edit/delete) trigger their respective callbacks
  it("fires edit and delete callbacks correctly", () => {
    render(
      <GroupTasks
        tasksWithProgress={mockTasks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    fireEvent.click(screen.getByTitle("Edit task"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTasks[0]);

    fireEvent.click(screen.getByTitle("Delete task"));
    expect(mockOnDelete).toHaveBeenCalledWith("g-tsk-1");
  });

  // Confirms the UI logic properly hides the description field when null
  it("does not render description when null", () => {
    const task = [{ ...mockTasks[0], description: null }];

    render(
      <GroupTasks
        tasksWithProgress={task}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.queryByText("Slides 1-5")).not.toBeInTheDocument();
  });

  // Confirms the due date section is omitted when data is missing
  it("does not render due date when missing", () => {
    const task = [{ ...mockTasks[0], dueDate: null }];

    render(
      <GroupTasks
        tasksWithProgress={task}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.queryByText(/Due:/i)).not.toBeInTheDocument();
  });

  // Confirms the duration section is omitted when the value is 0
  it("does not render duration when 0", () => {
    const task = [{ ...mockTasks[0], duration: 0 }];

    render(
      <GroupTasks
        tasksWithProgress={task}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.queryByText("⏱️ 2h")).not.toBeInTheDocument();
  });

  // Confirms the priority badge still renders even with unexpected string values
  it("handles unknown priority (fallback branch)", () => {
    const task = [{ ...mockTasks[0], priority: "Unknown" }];

    render(
      <GroupTasks
        tasksWithProgress={task}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  // Confirms that completed tasks receive the visual line-through styling
  it("renders completed task state", () => {
    const task = [{ ...mockTasks[0], currentUserCompleted: true }];

    render(
      <GroupTasks
        tasksWithProgress={task}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText("Draft Presentation")).toHaveClass("line-through");
  });
});