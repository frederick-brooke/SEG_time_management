import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import React from "react";

// ─────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────
jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value, onClick }: any) => (
    <div onClick={() => onClick?.(value)}>{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock("@/components/ui/toggle-group", () => ({
  ToggleGroup: ({ children, onValueChange }: any) => (
    <div>
      {React.Children.map(children, (child: any) =>
        React.cloneElement(child, { onSelect: onValueChange })
      )}
    </div>
  ),
  ToggleGroupItem: ({ children, value, onSelect }: any) => (
    <button onClick={() => onSelect?.(value)}>{children}</button>
  ),
}));

jest.mock("@/components/ui/lunar-card", () => ({
  LunarCard: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}));

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
const baseProps = {
  isOpen: true,
  onOpenChange: jest.fn(),
  editingTaskId: null,
  formData: {
    name: "",
    description: "",
    dueDate: "",
    url: "",
    subtasks: "",
    durationHours: "",
    durationMinutes: "",
    examId: "none",
    priority: "",
  },
  onFormChange: jest.fn(),
  onSubmit: jest.fn(),
  exams: [{ id: "1", title: "Math" }],
};

// ─────────────────────────────────────────
// Tests
// ─────────────────────────────────────────
describe("TaskFormDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Render conditions ───────────────────
  it("renders trigger button when showTrigger is true", () => {
    render(<TaskFormDialog {...baseProps} showTrigger={true} />);
    expect(screen.getByText("+ NEW TASK")).toBeInTheDocument();
  });

  it("does not render modal content when closed", () => {
	render(<TaskFormDialog {...baseProps} isOpen={false} />);

	const overlay = document.querySelector(".lunar-overlay");
	expect(overlay).toHaveClass("hidden");
	});

  // ── Mode rendering ──────────────────────
  it("shows create mode text", () => {
    render(<TaskFormDialog {...baseProps} />);
    expect(screen.getByText("Create New Task")).toBeInTheDocument();
  });

  it("shows edit mode text", () => {
    render(
      <TaskFormDialog {...baseProps} editingTaskId="123" />
    );
    expect(screen.getByText("Edit Task")).toBeInTheDocument();
  });

  // ── Input changes ───────────────────────
  it("calls onFormChange when typing in name", () => {
    render(<TaskFormDialog {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText("Enter task name"), {
      target: { value: "New Task" },
    });

    expect(baseProps.onFormChange).toHaveBeenCalledWith({
      name: "New Task",
    });
  });

  it("calls onFormChange for description", () => {
    render(<TaskFormDialog {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText("Enter task description"), {
      target: { value: "Desc" },
    });

    expect(baseProps.onFormChange).toHaveBeenCalledWith({
      description: "Desc",
    });
  });

  it("calls onFormChange for due date", () => {
    render(<TaskFormDialog {...baseProps} />);

    fireEvent.change(screen.getByLabelText("Due Date"), {
      target: { value: "2025-01-01" },
    });

    expect(baseProps.onFormChange).toHaveBeenCalledWith({
      dueDate: "2025-01-01",
    });
  });

  it("calls onFormChange for url", () => {
    render(<TaskFormDialog {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText("No URL attached"), {
      target: { value: "https://test.com" },
    });

    expect(baseProps.onFormChange).toHaveBeenCalledWith({
      url: "https://test.com",
    });
  });

  it("calls onFormChange for subtasks", () => {
    render(<TaskFormDialog {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Research, Edit"), {
      target: { value: "A,B" },
    });

    expect(baseProps.onFormChange).toHaveBeenCalledWith({
      subtasks: "A,B",
    });
  });

  // ── URL button ──────────────────────────
  it("shows URL link button when url exists", () => {
    render(
      <TaskFormDialog
        {...baseProps}
        formData={{ ...baseProps.formData, url: "https://x.com" }}
      />
    );

    expect(screen.getByText("🔗")).toBeInTheDocument();
  });

  // ── Exam dropdown ───────────────────────
  it("renders exam options", () => {
    render(<TaskFormDialog {...baseProps} />);
    expect(screen.getByText("Math")).toBeInTheDocument();
  });

  // ── Priority toggle ─────────────────────
  it("calls onFormChange when selecting priority", () => {
    render(<TaskFormDialog {...baseProps} />);

    fireEvent.click(screen.getByText("High"));

    expect(baseProps.onFormChange).toHaveBeenCalledWith({
      priority: "High",
    });
  });

  // ── Submit ──────────────────────────────
  it("calls onSubmit with formData", () => {
    render(<TaskFormDialog {...baseProps} />);

    fireEvent.click(screen.getByText("Create Task"));

    expect(baseProps.onSubmit).toHaveBeenCalledWith(
      baseProps.formData
    );
  });

  it("shows update button in edit mode", () => {
    render(
      <TaskFormDialog {...baseProps} editingTaskId="123" />
    );

    expect(screen.getByText("Update Task")).toBeInTheDocument();
  });

  // ── Close behavior ──────────────────────
  it("calls onOpenChange(false) when clicking close button", () => {
    render(<TaskFormDialog {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: "" }));

    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when clicking overlay", () => {
    render(<TaskFormDialog {...baseProps} />);

    const overlay = document.querySelector(".lunar-overlay")!;
    fireEvent.click(overlay);

    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does NOT close when clicking inside card", () => {
    render(<TaskFormDialog {...baseProps} />);

    const card = document.querySelector(".lunar-card")!;
    fireEvent.click(card);

    expect(baseProps.onOpenChange).not.toHaveBeenCalledWith(false);
  });
});