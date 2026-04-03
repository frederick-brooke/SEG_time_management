/**
 * Testing for Task View Dialog
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TaskViewDialog } from "../TaskViewDialog";

// Mocks

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

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

global.fetch = jest.fn();

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

  it("calls the API and triggers onReward when 'Complete' is clicked", async () => {
    const mockOnReward = jest.fn();
    const mockOnClose = jest.fn();
    const task = { id: "task-123", title: "Test task", priority: "High" };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rewards: { xp: 50, coins: 20 } }),
    });

    render(
      <TaskViewDialog
        task={task}
        isOpen={true}
        onClose={mockOnClose}
        onReward={mockOnReward}
        getPriorityStyle={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByText(/mark as done/i));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tasks/task-123"),
        expect.objectContaining({ method: "PATCH" }),
      );
      expect(mockOnReward).toHaveBeenCalledWith({ xp: 50, coins: 20 });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("successfully completes a task and triggers rewards", async () => {
    const mockOnReward = jest.fn();
    const mockOnClose = jest.fn();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rewards: { xp: 20, coins: 10 } }),
    });

    render(
      <TaskViewDialog
        task={{ id: "t-1", title: "Complete" }}
        isOpen={true}
        onClose={mockOnClose}
        onReward={mockOnReward}
        getPriorityStyle={() => ""}
      />,
    );

    fireEvent.click(screen.getByText(/mark as done/i));

    await waitFor(() => {
      expect(mockOnReward).toHaveBeenCalledWith({ xp: 20, coins: 10 });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles API errors in handleCompleteTask", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    render(
      <TaskViewDialog
        task={{ id: "t-1", title: "Fail" }}
        isOpen={true}
        onClose={jest.fn()}
        getPriorityStyle={() => ""}
      />,
    );

    fireEvent.click(screen.getByText(/mark as done/i));

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it("hits catch block on hard network failure", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network failure"),
    );

    render(
      <TaskViewDialog
        task={{ id: "t-err", title: "Fail" }}
        isOpen={true}
        onClose={jest.fn()}
        getPriorityStyle={() => ""}
      />,
    );

    fireEvent.click(screen.getByText(/mark as done/i));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        "Failed to update task:",
        expect.any(Error),
      );
    });
    spy.mockRestore();
  });

  it("does not crash if rewards exist but onReward prop is missing", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rewards: { xp: 10 } }),
    });

    render(
      <TaskViewDialog
        task={{ id: "t-no-cb", title: "No callback" }}
        isOpen={true}
        onClose={jest.fn()}
        getPriorityStyle={() => ""}
      />,
    );

    fireEvent.click(screen.getByText(/mark as done/i));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it("sets and clears loading state during API call", async () => {
    let resolveFetch: (value: any) => void;
    const pendingPromise = new Promise<any>((resolve) => {
      resolveFetch = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(pendingPromise);

    render(
      <TaskViewDialog
        task={{ id: "t-load", title: "Load task" }}
        isOpen={true}
        onClose={jest.fn()}
        getPriorityStyle={() => ""}
      />,
    );

    const completeBtn = screen.getByText(/mark as done/i);
    fireEvent.click(completeBtn);

    expect(completeBtn).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    resolveFetch!({
      ok: true,
      json: async () => ({ success: true }),
    });

    await waitFor(() => {
      expect(completeBtn).not.toBeDisabled();
    });
  });
});