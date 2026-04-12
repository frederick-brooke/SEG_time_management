import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ReminderModal from "../ReminderModal"; 

// Mocks

jest.mock("@/context/UIContext", () => ({
  useUI: () => ({
    setIsModalOpen: jest.fn(),
  }),
}));

jest.mock("@tabler/icons-react", () => ({
  IconHeartSpark: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="heart-icon" {...props} />
  ),
}));

jest.mock("@/components/ui/LunarCard", () => ({
  LunarCard: ({
    children,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler;
    variant?: string;
  }) => (
    <div data-testid="lunar-card" className={className} onClick={onClick}>
      {children}
    </div>
  ),
}));

// Setup — modal-root portal target

beforeEach(() => {
  const modalRoot = document.createElement("div");
  modalRoot.setAttribute("id", "modal-root");
  document.body.appendChild(modalRoot);
});

afterEach(() => {
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot) document.body.removeChild(modalRoot);
});


// Helpers

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  title: "Reminder",
  children: <p>Don't forget to check in today!</p>,
};

function renderModal(props = {}) {
  return render(<ReminderModal {...defaultProps} {...props} />);
}

// ReminderModal

describe("ReminderModal", () => {
  beforeEach(() => jest.clearAllMocks());

  // Visibility
  it("renders nothing when open is false", () => {
    renderModal({ open: false });
    expect(screen.queryByTestId("lunar-card")).not.toBeInTheDocument();
  });

  it("renders nothing when modal-root does not exist", () => {
    const modalRoot = document.getElementById("modal-root");
    if (modalRoot) document.body.removeChild(modalRoot);

    renderModal({ open: true });
    expect(screen.queryByTestId("lunar-card")).not.toBeInTheDocument();
  });

  it("renders the modal card when open is true", () => {
    renderModal();
    expect(screen.getByTestId("lunar-card")).toBeInTheDocument();
  });

  // Content
  it("renders the title", () => {
    renderModal();
    expect(screen.getByText("Reminder")).toBeInTheDocument();
  });

  it("title is rendered in an h2", () => {
    renderModal();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Reminder");
  });

  it("renders children content", () => {
    renderModal();
    expect(
      screen.getByText("Don't forget to check in today!")
    ).toBeInTheDocument();
  });

  it("renders the heart icon", () => {
    renderModal();
    expect(screen.getByTestId("heart-icon")).toBeInTheDocument();
  });

  it("renders the OK button", () => {
    renderModal();
    expect(screen.getByRole("button", { name: "OK!" })).toBeInTheDocument();
  });

  it("renders the close button with aria-label='Close'", () => {
    renderModal();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  // onClose interactions
  it("calls onClose when the close (✕) button is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderModal({ onClose });
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the OK button is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderModal({ onClose });
    await user.click(screen.getByRole("button", { name: "OK!" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop overlay is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderModal({ onClose });
    const overlay = document
      .getElementById("modal-root")!
      .querySelector(".bg-black\\/60") as HTMLElement;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when the modal card itself is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderModal({ onClose });
    await user.click(screen.getByTestId("lunar-card"));
    expect(onClose).not.toHaveBeenCalled();
  });

  // Portal rendering
  it("renders into the modal-root portal, not the React root", () => {
    const { container } = renderModal();
    expect(container).toBeEmptyDOMElement();
    expect(
      document.getElementById("modal-root")!.querySelector("[data-testid='lunar-card']")
    ).toBeInTheDocument();
  });

  // Dynamic title & children
  it("renders a different title when the prop changes", () => {
    renderModal({ title: "Meeting at 3pm" });
    expect(screen.getByText("Meeting at 3pm")).toBeInTheDocument();
  });

  it("renders string children", () => {
    renderModal({ children: "A plain text reminder" });
    expect(screen.getByText("A plain text reminder")).toBeInTheDocument();
  });
});
