import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteTaskDialog } from "../DeleteTaskDialog";

describe("DeleteTaskDialog", () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  const renderDialog = (isOpen = true) =>
    render(
      <DeleteTaskDialog
        isOpen={isOpen}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ─────────────────────────────────────
  it("does not render when isOpen is false", () => {
    renderDialog(false);
    expect(screen.queryByText("Delete Task?")).toBeNull();
  });

  it("renders dialog content when open", () => {
    renderDialog();

    expect(screen.getByText("Delete Task?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This will permanently delete this task. This cannot be undone."
      )
    ).toBeInTheDocument();
  });

  // ── Buttons ───────────────────────────────────────
  it("calls onConfirm when clicking Delete button", () => {
    renderDialog();

    fireEvent.click(screen.getByText("Delete"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when clicking Cancel button", () => {
    renderDialog();

    fireEvent.click(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  // ── Overlay behavior ──────────────────────────────
  it("calls onCancel when clicking overlay", () => {
    renderDialog();

    const overlay = screen
      .getByText("Delete Task?")
      .closest("div")!  // inner card
      .parentElement!;  // overlay

    fireEvent.click(overlay);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onCancel when clicking inside modal", () => {
    renderDialog();

    const modal = screen.getByText("Delete Task?").closest("div")!;

    fireEvent.click(modal);

    expect(onCancel).not.toHaveBeenCalled();
  });
});