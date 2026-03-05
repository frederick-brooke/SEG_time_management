import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteTaskDialog } from "../DeleteTaskDialog";

/**
 * Mock AlertDialog via RELATIVE PATHS to avoid alias mapping issues.
 * src/components/tasks/__tests__ -> src/components/ui
 */
jest.mock("../../ui/alert-dialog", () => {
  const React = require("react");

  function AlertDialog({ open, onOpenChange, children }) {
    if (!open) return null;
    return (
      <div data-testid="alert-dialog-root">
        {/* Expose onOpenChange to test the !open && onCancel() branch */}
        <button
          type="button"
          data-testid="simulate-open-change-true"
          onClick={() => onOpenChange(true)}
        >
          simulate-open
        </button>
        <button
          type="button"
          data-testid="simulate-open-change-false"
          onClick={() => onOpenChange(false)}
        >
          simulate-close
        </button>
        {children}
      </div>
    );
  }

  function AlertDialogContent({ children }) {
    return <div data-testid="alert-dialog-content">{children}</div>;
  }
  function AlertDialogHeader({ children }) {
    return <div data-testid="alert-dialog-header">{children}</div>;
  }
  function AlertDialogTitle({ children }) {
    return <h2>{children}</h2>;
  }
  function AlertDialogDescription({ children }) {
    return <p>{children}</p>;
  }
  function AlertDialogFooter({ children }) {
    return <div data-testid="alert-dialog-footer">{children}</div>;
  }
  function AlertDialogCancel({ children, onClick }) {
    return (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    );
  }
  function AlertDialogAction({ children, onClick }) {
    return (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    );
  }

  return {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  };
});

describe("DeleteTaskDialog", () => {
  it("renders when open and shows text", () => {
    render(
      <DeleteTaskDialog isOpen={true} onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );

    expect(screen.getByText("Delete Task?")).toBeInTheDocument();
    expect(
      screen.getByText(/This will permanently delete this task/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("calls onCancel when dialog closes via onOpenChange(false) and NOT when onOpenChange(true)", () => {
    const onCancel = jest.fn();

    render(
      <DeleteTaskDialog isOpen={true} onConfirm={jest.fn()} onCancel={onCancel} />,
    );

    fireEvent.click(screen.getByTestId("simulate-open-change-true"));
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("simulate-open-change-false"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = jest.fn();

    render(
      <DeleteTaskDialog isOpen={true} onConfirm={jest.fn()} onCancel={onCancel} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Delete button is clicked", () => {
    const onConfirm = jest.fn();

    render(
      <DeleteTaskDialog isOpen={true} onConfirm={onConfirm} onCancel={jest.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
