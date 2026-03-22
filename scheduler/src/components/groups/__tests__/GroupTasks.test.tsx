import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupTasks from "@/components/groups/GroupTasks";

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
    completedMembers: [{ id: "u1", fname: "Alice", lname: "Smith" }],
    inProgressMembers: [{ id: "u2", fname: "Bob", lname: "Jones" }],
  },
];

describe("GroupTasks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Verifies the empty state renders properly when the task array is empty.
   */
  it("renders empty state correctly", () => {
    render(<GroupTasks tasksWithProgress={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleComplete={mockOnToggleComplete} />);
    expect(screen.getByText("Group Tasks (0)")).toBeInTheDocument();
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
  });

  /**
   * Checks that the complex `TaskWithProgress` object maps all its properties 
   * (title, priority, duration, dates) to the UI elements accurately.
   */
  it("renders task details correctly", () => {
    render(<GroupTasks tasksWithProgress={mockTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleComplete={mockOnToggleComplete} />);
    expect(screen.getByText("Draft Presentation")).toBeInTheDocument();
    expect(screen.getByText("Slides 1-5")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("📅 Due: Nov 1")).toBeInTheDocument();
    expect(screen.getByText("⏱️ 2h")).toBeInTheDocument();
  });

  /**
   * Tests the interactive "MemberProgressBadge" popover. Clicking the badge 
   * should expose the hidden list of member names who fall under that status.
   */
  it("toggles member progress badges to reveal names", () => {
    render(<GroupTasks tasksWithProgress={mockTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleComplete={mockOnToggleComplete} />);
    
    // Check completed popover
    fireEvent.click(screen.getByText("1 completed"));
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();

    // Check in-progress popover
    fireEvent.click(screen.getByText("1 in progress"));
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  /**
   * Ensures the individual user toggle (Mark Complete/Incomplete) fires the 
   * state update callback correctly to alter their personal task copy.
   */
  it("fires onToggleComplete when the completion circle is clicked", () => {
    render(<GroupTasks tasksWithProgress={mockTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleComplete={mockOnToggleComplete} />);
    
    const completeToggle = screen.getByTitle("Mark complete");
    fireEvent.click(completeToggle);
    expect(mockOnToggleComplete).toHaveBeenCalledWith(mockTasks[0]);
  });

  /**
   * Tests the global task action buttons (Edit/Delete).
   */
  it("fires edit and delete callbacks with correct arguments", () => {
    render(<GroupTasks tasksWithProgress={mockTasks} onEdit={mockOnEdit} onDelete={mockOnDelete} onToggleComplete={mockOnToggleComplete} />);
    
    fireEvent.click(screen.getByTitle("Edit task"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTasks[0]);

    fireEvent.click(screen.getByTitle("Delete task"));
    expect(mockOnDelete).toHaveBeenCalledWith("g-tsk-1");
  });
});