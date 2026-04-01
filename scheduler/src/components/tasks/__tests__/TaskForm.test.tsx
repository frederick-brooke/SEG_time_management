import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskForm } from "../TaskForm";
import { Select } from "@/components/ui/Select";

jest.mock("../../ui/dialog", () => {
  const React = require("react");

  function Dialog({ open, children }) {
    return open ? <div data-testid="dialog-root">{children}</div> : null;
  }
  function DialogTrigger({ children }) {
    return <div data-testid="dialog-trigger">{children}</div>;
  }
  function DialogContent({ children }) {
    return (
      <div data-testid="dialog-content">
        <button aria-label="close" className="lunar-close-button">X</button>
        {children}
      </div>
    );
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
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  };
});

jest.mock("../../ui/Input", () => {
  const React = require("react");
  return {
    Input: ({ id, value, onChange, placeholder, type = "text" }) => (
      <input
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
      />
    ),
  };
});

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock("../../ui/Label", () => {
  const React = require("react");
  return {
    Label: ({ htmlFor, children }) => <label htmlFor={htmlFor}>{children}</label>,
  };
});

jest.mock("../../ui/Button", () => {
  const React = require("react");
  return {
    Button: ({ children, onClick, buttonType = "button" }) => (
      <button type={buttonType as "button"} onClick={onClick}>
        {children}
      </button>
    ),
  };
});

jest.mock("../../ui/Select", () => {
  const React = require("react");

  return {
    Select: ({ value, onValueChange, children }: any) => (
      <select 
        data-testid="mock-select" 
        value={value} 
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: any) => <></>,
    SelectValue: ({ placeholder }: any) => <></>,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => (
      <option value={value}>{children}</option>
    ),
  };
});

jest.mock("../../ui/ToggleGroup", () => {
  const React = require("react");

  function ToggleGroup({ value, onValueChange, children }) {
    return (
      <div data-testid="toggle-group" data-value={value}>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          return React.cloneElement(child, {
            __onValueChange: onValueChange,
          });
        })}
      </div>
    );
  }

  function ToggleGroupItem({ value, children, __onValueChange }) {
    return (
      <button type="button" onClick={() => __onValueChange(value)}>
        {children}
      </button>
    );
  }

  return { ToggleGroup, ToggleGroupItem };
});

describe("TaskFormDialog", () => {
  const baseFormData = {
    name: "",
    description: "",
    dueDate: "",
    subtasks: "",
    durationHours: "0",
    durationMinutes: "0",
    priority: "Low",
  };

  function setup(overrides = {}) {
    const props = {
      isOpen: true,
      onOpenChange: jest.fn(),
      editingTaskId: null,
      formData: baseFormData,
      onFormChange: jest.fn(),
      onSubmit: jest.fn(),
      ...overrides,
    };

    render(<TaskForm {...props} />);
    return props;
  }

  it("renders Create mode when editingTaskId is null", () => {
    setup({ editingTaskId: null });

    expect(screen.getByText("Create New Task")).toBeInTheDocument();
    expect(screen.getByText("Add a new task to your list")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Task" })).toBeInTheDocument();
  });

  it("renders Edit mode when editingTaskId is not null", () => {
    setup({ editingTaskId: "abc123" });

    expect(screen.getByText("Edit Task")).toBeInTheDocument();
    expect(screen.getByText("Update the task details below")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Task" })).toBeInTheDocument();
  });

  it("calls onFormChange for text/date inputs", () => {
    const props = setup();

    fireEvent.change(screen.getByLabelText("Task Name"), {
      target: { value: "Write report" },
    });
    expect(props.onFormChange).toHaveBeenCalledWith({ name: "Write report" });

    fireEvent.change(screen.getByLabelText("Task Description"), {
      target: { value: "Do the first draft" },
    });
    expect(props.onFormChange).toHaveBeenCalledWith({ description: "Do the first draft" });

    fireEvent.change(screen.getByLabelText("Due Date"), {
      target: { value: "2026-02-19" },
    });
    expect(props.onFormChange).toHaveBeenCalledWith({ dueDate: "2026-02-19" });

    fireEvent.change(screen.getByLabelText("Subtasks (comma separated)"), {
      target: { value: "Research, Outline, Draft" },
    });
    expect(props.onFormChange).toHaveBeenCalledWith({
      subtasks: "Research, Outline, Draft",
    });
  });

  it("calls onFormChange when hours/minutes select changes", () => {
    const props = setup({
      formData: { ...baseFormData, durationHours: "0", durationMinutes: "0" },
    });

    const selects = screen.getAllByTestId("mock-select");
    const [hoursSelect, minutesSelect] = selects;

    fireEvent.change(hoursSelect, { target: { value: "2" } });
    expect(props.onFormChange).toHaveBeenCalledWith({ durationHours: "2" });

    fireEvent.change(minutesSelect, { target: { value: "15" } });
    expect(props.onFormChange).toHaveBeenCalledWith({ durationMinutes: "15" });
  });

  it("calls onFormChange when priority toggles are clicked", () => {
    const props = setup({ formData: { ...baseFormData, priority: "Low" } });

    fireEvent.click(screen.getByRole("button", { name: "Medium" }));
    expect(props.onFormChange).toHaveBeenCalledWith({ priority: "Medium" });

    fireEvent.click(screen.getByRole("button", { name: "High" }));
    expect(props.onFormChange).toHaveBeenCalledWith({ priority: "High" });
  });

  it("calls onSubmit when name is provided", () => {
    const props = setup({ 
      editingTaskId: null,
      formData: { ...baseFormData, name: "My Task"}
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Task" }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not call onSubmit when name is empty", () => {
    const props = setup({ 
      editingTaskId: null,
      formData: { ...baseFormData, name: ""}
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Task" }));
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it("renders exams in dropdown when provided", () => {
    setup({ 
      exams: [{ id: "exam1", title: "Maths Exam" }]
    });

    expect(screen.getByText("Maths Exam")).toBeInTheDocument();
  });

  it("hides trigger button when showTrigger is false", () => {
    setup({ showTrigger: false });
    expect(screen.queryByText("+ NEW TASK")).not.toBeInTheDocument();
  });

  it("clicking the backdrop calls onOpenChange with false", () => {
    const props = setup();
    const backdrop = document.querySelector(".bg-black\\/60");
    fireEvent.click(backdrop!, { target: backdrop });
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onFormChange when URL input changes", () => {
    const props = setup();
    fireEvent.change(screen.getByPlaceholderText("No URL attached"), {
      target: { value: "https://example.com" },
    });
    expect(props.onFormChange).toHaveBeenCalledWith({ url: "https://example.com" });
  });

  it("renders URL link button when url is provided", () => {
    setup({
      formData: { ...baseFormData, url: "https://example.com" }
    });
    expect(screen.getByText("🔗")).toBeInTheDocument();
  });

  it("shows + NEW TASK trigger when showTrigger is true", () => {
    setup({ showTrigger: true });
    fireEvent.click(screen.getByText("+ NEW TASK"));
    expect(screen.getByText("+ NEW TASK")).toBeInTheDocument();
  });
  

});
