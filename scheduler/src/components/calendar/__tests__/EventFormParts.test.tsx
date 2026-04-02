import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import {
  relativeTo,
  RELATIVE_OPTIONS,
  TaskPromptSection,
} from "../EventFormParts";
import type { RelativeOption } from "../EventFormParts";

// Mocks

jest.mock("../LinkedTaskCard", () => ({
  LinkedTaskCard: ({ task, onRemove, onUpdate, index }: any) => (
    <div data-testid={`linked-task-${index}`}>
      <span>{task.title}</span>
      <Button onClick={() => onUpdate(index, { ...task, title: "Updated Task" })}>Update</Button>
      <Button onClick={() => onRemove(index)}>Remove</Button>
    </div>
  ),
}));

jest.mock("../NewTaskForm", () => ({
  NewTaskForm: ({ onAdd }: any) => (
    <Button
      data-testid="add-task-btn"
      onClick={() => onAdd({ title: "New Task", duration: 60, priority: "Medium" })}
    >
      Add Task
    </Button>
  ),
}));

global.fetch = jest.fn().mockResolvedValue({ ok: true });

// relativeTo

describe("relativeTo", () => {
  it('returns "custom" for custom mode', () => {
    expect(relativeTo("custom")).toBe("custom");
  });

  it('returns "during" for same-day mode', () => {
    expect(relativeTo("same-day")).toBe("during");
  });

  it('returns "before" for all before modes', () => {
    expect(relativeTo("1-before")).toBe("before");
    expect(relativeTo("2-before")).toBe("before");
    expect(relativeTo("3-before")).toBe("before");
  });

  it('returns "after" for all after modes', () => {
    expect(relativeTo("1-after")).toBe("after");
    expect(relativeTo("2-after")).toBe("after");
    expect(relativeTo("3-after")).toBe("after");
  });
});

// RELATIVE_OPTIONS

describe("RELATIVE_OPTIONS", () => {
  it("contains 8 options", () => {
    expect(RELATIVE_OPTIONS).toHaveLength(8);
  });

  it("has correct offsetDays for each option", () => {
    const map: Record<RelativeOption, number | null> = {
      "3-before": -3,
      "2-before": -2,
      "1-before": -1,
      "same-day": 0,
      "1-after": 1,
      "2-after": 2,
      "3-after": 3,
      custom: null,
    };
    RELATIVE_OPTIONS.forEach((opt) => {
      expect(opt.offsetDays).toBe(map[opt.key]);
    });
  });

  it("custom option has null offsetDays", () => {
    const custom = RELATIVE_OPTIONS.find((o) => o.key === "custom");
    expect(custom?.offsetDays).toBeNull();
  });
});

// TaskPromptSection

const defaultProps = {
  createdEventId: "event-123",
  userId: "user-456",
  eventStartDate: "2026-04-01",
  defaultUntil: "2026-06-01",
  onFinish: jest.fn(),
};

describe("TaskPromptSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the prompt header", () => {
    render(<TaskPromptSection {...defaultProps} />);
    expect(screen.getByText("Link tasks to this event?")).toBeInTheDocument();
  });

  it("renders the NewTaskForm", () => {
    render(<TaskPromptSection {...defaultProps} />);
    expect(screen.getByTestId("add-task-btn")).toBeInTheDocument();
  });

  it('shows "Skip — No Tasks" when no tasks added', () => {
    render(<TaskPromptSection {...defaultProps} />);
    expect(screen.getByText("Skip — No Tasks")).toBeInTheDocument();
  });

  it('shows "Save Tasks & Finish" after a task is added', () => {
    render(<TaskPromptSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-task-btn"));
    expect(screen.getByText("Save Tasks & Finish")).toBeInTheDocument();
  });

  it("renders a LinkedTaskCard for each added task", () => {
    render(<TaskPromptSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-task-btn"));
    expect(screen.getByTestId("linked-task-0")).toBeInTheDocument();
  });

  it("attaches userId and eventId to added tasks", () => {
    render(<TaskPromptSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-task-btn"));
    expect(screen.getByText("New Task")).toBeInTheDocument();
  });

  it("removes a task when onRemove is called", () => {
    render(<TaskPromptSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-task-btn"));
    expect(screen.getByTestId("linked-task-0")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Remove"));
    expect(screen.queryByTestId("linked-task-0")).not.toBeInTheDocument();
  });

  it("calls fetch with tasks on save when tasks exist", async () => {
    render(<TaskPromptSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-task-btn"));
    fireEvent.click(screen.getByText("Save Tasks & Finish"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/tasks",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("New Task"),
        }),
      );
    });
  });

  it("dispatches tasks-updated event after save", async () => {
    const dispatchSpy = jest.spyOn(window, "dispatchEvent");
    render(<TaskPromptSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-task-btn"));
    fireEvent.click(screen.getByText("Save Tasks & Finish"));

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "tasks-updated" }),
      );
    });
  });

  it("calls onFinish after save", async () => {
    render(<TaskPromptSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-task-btn"));
    fireEvent.click(screen.getByText("Save Tasks & Finish"));

    await waitFor(() => {
      expect(defaultProps.onFinish).toHaveBeenCalled();
    });
  });

  it("updates a task when onUpdate is called", () => {
    render(<TaskPromptSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-task-btn"));
    expect(screen.getByText("New Task")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Update"));
    expect(screen.getByText("Updated Task")).toBeInTheDocument();
  });

  it("only updates the correct task when multiple tasks exist", () => {
    render(<TaskPromptSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId("add-task-btn"));
    fireEvent.click(screen.getByTestId("add-task-btn"));
    expect(screen.getByTestId("linked-task-0")).toBeInTheDocument();
    expect(screen.getByTestId("linked-task-1")).toBeInTheDocument();
    // Update only the first task
    fireEvent.click(screen.getAllByText("Update")[0]);
    expect(screen.getAllByText("Updated Task")).toHaveLength(1);
  });

  it("calls onFinish without fetching when no tasks", async () => {
    render(<TaskPromptSection {...defaultProps} />);
    fireEvent.click(screen.getByText("Skip — No Tasks"));

    await waitFor(() => {
      expect(defaultProps.onFinish).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});