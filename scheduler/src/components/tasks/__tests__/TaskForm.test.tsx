import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskForm } from "../TaskForm";

/**
 * Mock shadcn/Radix wrappers via RELATIVE PATHS so Jest doesn't need alias config.
 * Path basis: src/components/tasks/__tests__ -> src/components/ui
 */

jest.mock("../../ui/dialog", () => {
  const React = require("react");

  function Dialog({ open, children }) {
    return open ? <div data-testid="dialog-root">{children}</div> : null;
  }
  function DialogTrigger({ children }) {
    return <div data-testid="dialog-trigger">{children}</div>;
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
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  };
});

jest.mock("../../ui/input", () => {
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

jest.mock("../../ui/label", () => {
  const React = require("react");
  return {
    Label: ({ htmlFor, children }) => <label htmlFor={htmlFor}>{children}</label>,
  };
});

jest.mock("../../ui/button", () => {
  const React = require("react");
  return {
    Button: ({ children, onClick, buttonType = "button" }) => (
      <button type={buttonType as "button"} onClick={onClick}>
        {children}
      </button>
    ),
  };
});

jest.mock("../../ui/select", () => {
  const React = require("react");

  function Select({ value, onValueChange, children }) {
    return (
      <select
        aria-label="mock-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    );
  }

  function SelectItem({ value, children }) {
    return <option value={value}>{children}</option>;
  }

  function SelectTrigger({ children }) {
    return <>{children}</>;
  }
  function SelectValue({ placeholder }) {
    return <span>{placeholder}</span>;
  }
  function SelectContent({ children }) {
    return <>{children}</>;
  }

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

jest.mock("../../ui/toggle-group", () => {
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

    const selects = screen.getAllByLabelText("mock-select");
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

  it("calls onSubmit on button click", () => {
    const props = setup({ editingTaskId: null });

    fireEvent.click(screen.getByRole("button", { name: "Create Task" }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });
});
