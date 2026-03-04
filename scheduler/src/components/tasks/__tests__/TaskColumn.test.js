import React from "react";
import { render, screen } from "@testing-library/react";
import { TaskColumn } from "../TaskColumn";

// Mock TaskCard so TaskColumn tests are isolated and stable
jest.mock("../TaskCard", () => ({
  TaskCard: ({ task }) => <div data-testid={`taskcard-${task.id}`} />,
}));

describe("TaskColumn", () => {
  const baseHandlers = {
    onToggle: jest.fn(),
    onView: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    getPriorityStyle: jest.fn(() => "style"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "1 task" when there is exactly one task (singular branch)', () => {
    render(
      <TaskColumn
        title="To Do"
        status="todo"
        tasks={[{ id: "t1", title: "One" }]}
        {...baseHandlers}
      />,
    );

    // This hits: tasks.length === 1 ? "task" : "tasks"
    expect(screen.getByText(/1\s+task/i)).toBeInTheDocument();
    expect(screen.getByTestId("taskcard-t1")).toBeInTheDocument();
  });

  it('shows "2 tasks" when there is more than one task (plural branch)', () => {
    render(
      <TaskColumn
        title="To Do"
        status="todo"
        tasks={[
          { id: "t1", title: "One" },
          { id: "t2", title: "Two" },
        ]}
        {...baseHandlers}
      />,
    );

    // Plural branch
    expect(screen.getByText(/2\s+tasks/i)).toBeInTheDocument();
    expect(screen.getByTestId("taskcard-t1")).toBeInTheDocument();
    expect(screen.getByTestId("taskcard-t2")).toBeInTheDocument();
  });
});
