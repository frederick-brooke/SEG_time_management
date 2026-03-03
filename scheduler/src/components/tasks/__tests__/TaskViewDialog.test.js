import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskViewDialog } from "../TaskViewDialog";

/**
 * Mock Dialog/Label/Button via RELATIVE PATHS so alias config isn't required.
 * src/components/tasks/__tests__ -> src/components/ui
 */

jest.mock("../../ui/dialog", () => {
  const React = require("react");

  function Dialog({ open, onOpenChange, children }) {
    // Render only when open, and expose onOpenChange so we can trigger branch coverage
    if (!open) return null;
    return (
      <div data-testid="dialog-root">
        <button
          type="button"
          data-testid="trigger-open-change-false"
          onClick={() => onOpenChange(false)}
        >
          simulate-close
        </button>
        <button
          type="button"
          data-testid="trigger-open-change-true"
          onClick={() => onOpenChange(true)}
        >
          simulate-open
        </button>
        {children}
      </div>
    );
  }

  function DialogContent({ children }) {
    return <div data-testid="dialog-content">{children}</div>;
  }
  function DialogHeader({ children }) {
    return <div data-testid="dialog-header">{children}</div>;
  }
  function DialogTitle({ children }) {
    return <h2>{children}</h2>;
  }
  function DialogDescription({ children }) {
    return <p>{children}</p>;
  }
  function DialogFooter({ children }) {
    return <div data-testid="dialog-footer">{children}</div>;
  }

  return {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  };
});

jest.mock("../../ui/label", () => {
  const React = require("react");
  return {
    Label: ({ children, className }) => (
      <span data-testid="label" className={className}>
        {children}
      </span>
    ),
  };
});

jest.mock("../../ui/button", () => {
  const React = require("react");
  return {
    Button: ({ children, onClick }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
  };
});

describe("TaskViewDialog", () => {
  const getPriorityStyle = jest.fn(() => "bg-red-100 text-red-700");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when task is not provided", () => {
    const { container } = render(
      <TaskViewDialog
        task={null}
        isOpen={true}
        onClose={jest.fn()}
        getPriorityStyle={getPriorityStyle}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders all task fields, formats duration/date, and lists subtasks when present", () => {
    const onClose = jest.fn();

    const task = {
      title: "My Task",
      description: "Some description",
      priority: "High",
      duration: 125, // 2h 5m
      dueDate: "2026-02-19T00:00:00.000Z",
      subtasks: ["One", "Two"],
    };

    render(
      <TaskViewDialog
        task={task}
        isOpen={true}
        onClose={onClose}
        getPriorityStyle={getPriorityStyle}
      />,
    );

    // Title + description header
    expect(screen.getByText("My Task")).toBeInTheDocument();
    expect(screen.getByText("Task Details")).toBeInTheDocument();

    // Description text
    expect(screen.getByText("Some description")).toBeInTheDocument();

    // Priority badge calls getPriorityStyle and renders text
    expect(getPriorityStyle).toHaveBeenCalledWith("High");
    expect(screen.getByText("High")).toBeInTheDocument();

    // Duration formatting
    expect(screen.getByText("2h 5m")).toBeInTheDocument();

    // Date formatting (en-US, Month Day, Year) — stable check: year must appear
    expect(screen.getByText(/2026/)).toBeInTheDocument();

    // Subtasks list
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();

    // onOpenChange(true) should NOT call onClose
    fireEvent.click(screen.getByTestId("trigger-open-change-true"));
    expect(onClose).not.toHaveBeenCalled();

    // onOpenChange(false) SHOULD call onClose (covers !open && onClose())
    fireEvent.click(screen.getByTestId("trigger-open-change-false"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders fallback text when description/duration/dueDate/subtasks are missing", () => {
    const onClose = jest.fn();

    const task = {
      title: "Empty-ish Task",
      description: "", // triggers fallback
      priority: "Low",
      duration: 0, // triggers "No estimate set"
      dueDate: null, // triggers "No due date set"
      subtasks: [], // triggers "No subtasks"
    };

    render(
      <TaskViewDialog
        task={task}
        isOpen={true}
        onClose={onClose}
        getPriorityStyle={getPriorityStyle}
      />,
    );

    expect(screen.getByText("Empty-ish Task")).toBeInTheDocument();

    expect(screen.getByText("No description provided")).toBeInTheDocument();
    expect(screen.getByText("No estimate set")).toBeInTheDocument();
    expect(screen.getByText("No due date set")).toBeInTheDocument();
    expect(screen.getByText("No subtasks")).toBeInTheDocument();

    // Close button click calls onClose
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("handles undefined subtasks via optional chaining and shows fallback", () => {
    const task = {
      title: "No Subtasks Field",
      description: "desc",
      priority: "Medium",
      duration: 60,
      dueDate: "2026-02-19T00:00:00.000Z",
      subtasks: undefined, // important for optional chaining branch
    };

    render(
      <TaskViewDialog
        task={task}
        isOpen={true}
        onClose={jest.fn()}
        getPriorityStyle={getPriorityStyle}
      />,
    );

    expect(screen.getByText("No subtasks")).toBeInTheDocument();
  });
});
