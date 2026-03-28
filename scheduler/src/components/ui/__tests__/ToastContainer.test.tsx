import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { ToastContainer } from "@/components/ui/ToastContainer";

// Mock lucide-react 
jest.mock("lucide-react", () => ({
  CheckCircle: ({ className }: { className?: string }) => (
    <svg data-testid="icon-check-circle" className={className} />
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <svg data-testid="icon-alert-circle" className={className} />
  ),
  Info: ({ className }: { className?: string }) => (
    <svg data-testid="icon-info" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <svg data-testid="icon-x" className={className} />
  ),
}));

// Fixtures 
const makeToast = (overrides = {}) => ({
  id: "toast-1",
  title: "Test Title",
  message: "Test message",
  type: "INFO" as const,
  ...overrides,
});

// ToastContainer
describe("ToastContainer", () => {
  it("renders nothing when toasts array is empty", () => {
    const { container } = render(
      <ToastContainer toasts={[]} onDismiss={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the container div when there are toasts", () => {
    const { container } = render(
      <ToastContainer toasts={[makeToast()]} onDismiss={jest.fn()} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("applies fixed positioning and z-index classes to the container", () => {
    const { container } = render(
      <ToastContainer toasts={[makeToast()]} onDismiss={jest.fn()} />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("fixed");
    expect(wrapper.className).toContain("bottom-6");
    expect(wrapper.className).toContain("right-6");
    expect(wrapper.className).toContain("z-[99999]");
  });

  it("renders one ToastItem per toast", () => {
    const toasts = [
      makeToast({ id: "t1", title: "First" }),
      makeToast({ id: "t2", title: "Second" }),
      makeToast({ id: "t3", title: "Third" }),
    ];
    render(<ToastContainer toasts={toasts} onDismiss={jest.fn()} />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });
});

// ToastItem — content 
describe("ToastItem content", () => {
  it("renders the toast title", () => {
    render(
      <ToastContainer toasts={[makeToast({ title: "Hello" })]} onDismiss={jest.fn()} />
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders the toast message", () => {
    render(
      <ToastContainer
        toasts={[makeToast({ message: "Something happened" })]}
        onDismiss={jest.fn()}
      />
    );
    expect(screen.getByText("Something happened")).toBeInTheDocument();
  });

  it("renders the dismiss (X) button", () => {
    render(
      <ToastContainer toasts={[makeToast()]} onDismiss={jest.fn()} />
    );
    expect(screen.getByTestId("icon-x")).toBeInTheDocument();
  });
});

// ToastItem — type styles & icons 
describe("ToastItem type variants", () => {
  it("applies SUCCESS styles and renders CheckCircle icon", () => {
    const { container } = render(
      <ToastContainer
        toasts={[makeToast({ type: "SUCCESS" })]}
        onDismiss={jest.fn()}
      />
    );
    const toastEl = container.querySelector(".border-green-500\\/40");
    expect(toastEl).toBeInTheDocument();
    expect(screen.getByTestId("icon-check-circle")).toBeInTheDocument();
  });

  it("applies ERROR styles and renders AlertCircle icon", () => {
    const { container } = render(
      <ToastContainer
        toasts={[makeToast({ type: "ERROR" })]}
        onDismiss={jest.fn()}
      />
    );
    const toastEl = container.querySelector(".border-red-500\\/40");
    expect(toastEl).toBeInTheDocument();
    expect(screen.getByTestId("icon-alert-circle")).toBeInTheDocument();
  });

  it("applies WARNING styles and renders AlertCircle icon", () => {
    const { container } = render(
      <ToastContainer
        toasts={[makeToast({ type: "WARNING" })]}
        onDismiss={jest.fn()}
      />
    );
    const toastEl = container.querySelector(".border-yellow-500\\/40");
    expect(toastEl).toBeInTheDocument();
    expect(screen.getByTestId("icon-alert-circle")).toBeInTheDocument();
  });

  it("applies INFO styles and renders Info icon", () => {
    const { container } = render(
      <ToastContainer
        toasts={[makeToast({ type: "INFO" })]}
        onDismiss={jest.fn()}
      />
    );
    const toastEl = container.querySelector(".border-blue-500\\/40");
    expect(toastEl).toBeInTheDocument();
    expect(screen.getByTestId("icon-info")).toBeInTheDocument();
  });
});

// ToastItem — dismiss interactions 
describe("ToastItem dismiss behaviour", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("calls onDismiss with the toast id when X button is clicked", () => {
    const onDismiss = jest.fn();
    render(
      <ToastContainer
        toasts={[makeToast({ id: "abc" })]}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith("abc");
  });

  it("auto-dismisses after 5 seconds", () => {
    const onDismiss = jest.fn();
    render(
      <ToastContainer
        toasts={[makeToast({ id: "timer-toast" })]}
        onDismiss={onDismiss}
      />
    );
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(5000));
    expect(onDismiss).toHaveBeenCalledWith("timer-toast");
  });

  it("does not auto-dismiss before 5 seconds", () => {
    const onDismiss = jest.fn();
    render(
      <ToastContainer
        toasts={[makeToast({ id: "early" })]}
        onDismiss={onDismiss}
      />
    );
    act(() => jest.advanceTimersByTime(4999));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("clears the timer on unmount", () => {
    const onDismiss = jest.fn();
    const { unmount } = render(
      <ToastContainer
        toasts={[makeToast({ id: "cleanup" })]}
        onDismiss={onDismiss}
      />
    );
    unmount();
    act(() => jest.advanceTimersByTime(5000));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("each toast in a list gets its own independent timer", () => {
    const onDismiss = jest.fn();
    render(
      <ToastContainer
        toasts={[
          makeToast({ id: "t1", title: "First" }),
          makeToast({ id: "t2", title: "Second" }),
        ]}
        onDismiss={onDismiss}
      />
    );
    act(() => jest.advanceTimersByTime(5000));
    expect(onDismiss).toHaveBeenCalledTimes(2);
    expect(onDismiss).toHaveBeenCalledWith("t1");
    expect(onDismiss).toHaveBeenCalledWith("t2");
  });
});
