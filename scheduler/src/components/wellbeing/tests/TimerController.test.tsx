import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import TimerController from "../TimerController";
import React from "react";
import { Button } from "@/components/ui/Button";

// ---- Mocks ----

const mockSetWellbeingOpen = jest.fn();

jest.mock("@/context/UIContext", () => ({
  useUI: () => ({
    wellbeingOpen: true,
    setWellbeingOpen: mockSetWellbeingOpen,
  }),
}));

let capturedOnTick;

jest.mock("@/components/wellbeing/timer", () => ({
  __esModule: true,
  default: ({ onTick }) => {
    capturedOnTick = onTick;
    return <div>MockTimer</div>;
  },
}));

jest.mock("@/components/ui/reminderModal", () => ({
  __esModule: true,
  default: ({ open, onClose, title, children }) =>
    open ? (
      <div>
        <span>{title}</span>
        <span>{children}</span>
        <Button onClick={onClose}>close</Button>
      </div>
    ) : null,
}));

describe("TimerController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnTick = null;
  });

  test("renders Timer", () => {
    render(<TimerController initialReminderAt={1000} />);
    expect(screen.getByText("MockTimer")).toBeInTheDocument();
  });

  test("does not trigger when remainingMs is null", async () => {
    render(<TimerController initialReminderAt={1000} />);

    await act(async () => {
      capturedOnTick(null);
    });

    expect(screen.queryByText(/Break time/i)).not.toBeInTheDocument();
  });

  test("does not trigger when remainingMs > reminderAtTime", async () => {
    render(<TimerController initialReminderAt={1000} />);

    await act(async () => {
      capturedOnTick(2000);
    });

    expect(screen.queryByText(/Break time/i)).not.toBeInTheDocument();
  });

  test("triggers reminder correctly", async () => {
    render(<TimerController initialReminderAt={1000} />);

    await act(async () => {
      capturedOnTick(500);
    });

    // DEBUG (keep this if needed)
    // screen.debug();

    expect(screen.getByText(/Break time/i)).toBeInTheDocument();
    expect(mockSetWellbeingOpen).toHaveBeenCalledWith(false);
  });

  test("modal closes correctly", async () => {
    render(<TimerController initialReminderAt={1000} />);

    await act(async () => {
      capturedOnTick(500);
    });

    fireEvent.click(screen.getByText(/close/i));

    expect(mockSetWellbeingOpen).toHaveBeenCalledWith(true);
  });

  test("fires only once before reset", async () => {
    render(<TimerController initialReminderAt={1000} />);

    await act(async () => {
      capturedOnTick(500); // fire
      capturedOnTick(400); // should NOT fire again
    });

    expect(mockSetWellbeingOpen).toHaveBeenCalledTimes(1);
  });

  test("resets after reaching 0", async () => {
    render(<TimerController initialReminderAt={1000} />);

    await act(async () => {
      capturedOnTick(500); // fire
      capturedOnTick(0);   // reset
      capturedOnTick(500); // fire again
    });

    expect(mockSetWellbeingOpen).toHaveBeenCalledTimes(2);
  });
});