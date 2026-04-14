/**
 * Testing for Task View Dialog
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { TaskViewDialog } from "../TaskViewDialog";

// Mocks
jest.mock("@/context/UIContext", () => ({
  useUI: () => ({
    setIsModalOpen: jest.fn(),
  }),
}));

jest.mock("../../ui/Dialog", () => {
  const React = require("react");

  function Dialog({ open, onOpenChange, children }: any) {
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

  function DialogContent({ children }: any) {
    return <div data-testid="dialog-content">{children}</div>;
  }
  function DialogHeader({ children }: any) {
    return <div data-testid="dialog-header">{children}</div>;
  }
  function DialogTitle({ children }: any) {
    return <h2>{children}</h2>;
  }
  function DialogDescription({ children }: any) {
    return <p>{children}</p>;
  }
  function DialogFooter({ children }: any) {
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

jest.mock("../../ui/Label", () => {
  const React = require("react");
  return {
    Label: ({ children, className }: any) => (
      <span data-testid="label" className={className}>
        {children}
      </span>
    ),
  };
});


jest.mock("../../ui/Button", () => {
  const React = require("react");
  return {
    Button: ({ children, onClick, disabled, type, variant, className, ...rest }: any) => (
      <button
        type={type || "button"}
        onClick={onClick}
        disabled={disabled}
        data-variant={variant || ""}
        className={className}
        {...rest}
      >
        {children}
        {disabled && "Loading..."}
      </button>
    ),
  };
});

jest.mock("../../ui/LunarCard", () => {
  const React = require("react");
  return {
    LunarCard: ({ children, className, onClick }: any) => (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    ),
  };
});

jest.mock("lucide-react", () => ({
  __esModule: true,
  X: () => <svg data-testid="icon-x" />,
  CheckCircle2: () => <svg data-testid="icon-check" />,
}));

// Tests

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

    expect(screen.getByText("My Task")).toBeInTheDocument();
    expect(screen.getByText("Task Details")).toBeInTheDocument();
    expect(screen.getByText("Some description")).toBeInTheDocument();

    expect(getPriorityStyle).toHaveBeenCalledWith("High");
    expect(screen.getByText("High")).toBeInTheDocument();

    expect(screen.getByText("2h 5m")).toBeInTheDocument();

    expect(screen.getByText(/2026/)).toBeInTheDocument();

    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders fallback text when description/duration/dueDate/subtasks are missing", () => {
    const onClose = jest.fn();

    const task = {
      title: "Empty-ish Task",
      description: "",
      priority: "Low",
      duration: 0,
      dueDate: null,
      subtasks: [],
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

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("handles undefined subtasks via optional chaining and shows fallback", () => {
    const task = {
      title: "No Subtasks Field",
      description: "desc",
      priority: "Medium",
      duration: 60,
      dueDate: "2026-02-19T00:00:00.000Z",
      subtasks: undefined,
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