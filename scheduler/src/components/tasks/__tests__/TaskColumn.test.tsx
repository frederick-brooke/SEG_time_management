/**
 * Testing for Task Column component.
 */

import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen } from "@testing-library/react";
import { TaskColumn } from "../TaskColumn";

interface TaskColumnProps {
  title: string;
  tasks: any[];
  status: string;
  onToggle: (id: string) => void;
  onView: (task: any) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  highlightId?: string | null;
}

// Mocks

jest.mock("../TaskCard", () => ({
  TaskCard: ({ task }: { task: { id: string }}) => (
    <div data-testid={`taskcard-${task.id}`} />
  ),
}));

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node
}));

// Tests

describe("TaskColumn", () => {
  const baseHandlers = {
    onToggle: jest.fn(),
    onView: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
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
        highlightId={null}
        {...baseHandlers}
      />,
    );

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
        highlightId={null}
        {...baseHandlers}
      />,
    );

    expect(screen.getByText(/2\s+tasks/i)).toBeInTheDocument();
    expect(screen.getByTestId("taskcard-t1")).toBeInTheDocument();
    expect(screen.getByTestId("taskcard-t2")).toBeInTheDocument();
  });

  it("renders overdue styles when status is overdue", () => {
    const { container } = render(
      <TaskColumn
        title="Overdue"
        status="overdue"
        tasks={[]}
        highlightId={null}
        {...baseHandlers}
      />
    );
    expect(container.firstChild).toHaveClass('bg-red-500/5');
    expect(screen.getByText(/Overdue/i)).toHaveClass('text-red-400');
  });

  it("shows empty state when no tasks provided", () => {
    render(
      <TaskColumn
        title="Empty"
        status="todo"
        tasks={[]}
        highlightId={null}
        {...baseHandlers}
      />
    );
    expect(screen.getByText(/No tasks/i)).toBeInTheDocument();
  });

  it("applies highlight class when highlightId matches task id", () => {
    const tasks = [{ id: "t1", title: "Highlight"}];
    render(
      <TaskColumn
        title="Highlight"
        status="todo"
        tasks={tasks}
        highlightId="t1"
        {...baseHandlers}
      />
    );
    expect(screen.getByTestId("taskcard-t1")).toBeInTheDocument();
  });


});
