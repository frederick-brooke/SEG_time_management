import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Timer from "../timer";

// --------------------
// Mock useTimer
// --------------------

const mockStartTimer = jest.fn();
const mockPauseTimer = jest.fn();
const mockResumeTimer = jest.fn();
const mockStopTimer = jest.fn();

let mockTimerState = {
  time: { hours: 0, minutes: 0, seconds: 0 },
  isRunning: false,
  hasStarted: false,
  remainingMs: 0,
};

jest.mock("hooks/useTimer", () => ({
  useTimer: () => ({
    ...mockTimerState,
    startTimer: mockStartTimer,
    pauseTimer: mockPauseTimer,
    resumeTimer: mockResumeTimer,
    stopTimer: mockStopTimer,
  }),
}));

// --------------------
// Mock Reminders
// --------------------

jest.mock("../reminders", () => ({
  __esModule: true,
  default: () => <div>MockReminders</div>,
}));

// --------------------
// Global fetch mock
// --------------------

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        endTime: Date.now() + 10000,
      }),
  })
);

// --------------------
// Tests
// --------------------

describe("Timer Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockTimerState = {
      time: { hours: 0, minutes: 0, seconds: 0 },
      isRunning: false,
      hasStarted: false,
      remainingMs: 0,
    };
  });

  test("renders time input when timer has not started", () => {
    render(<Timer />);

    expect(screen.getByDisplayValue("00:00:00")).toBeInTheDocument();
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  test("submits time and starts timer", async () => {
    render(<Timer />);

    const input = screen.getByDisplayValue("00:00:00");

    fireEvent.change(input, {
      target: { value: "00:00:10" },
    });

    fireEvent.click(screen.getByText("Start"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/wellbeing/timer",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    expect(mockStartTimer).toHaveBeenCalled();
  });

  test("shows pause button when running", () => {
    mockTimerState = {
      ...mockTimerState,
      hasStarted: true,
      isRunning: true,
    };

    render(<Timer />);

    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  test("calls pauseTimer when Pause clicked", () => {
    mockTimerState = {
      ...mockTimerState,
      hasStarted: true,
      isRunning: true,
    };

    render(<Timer />);

    fireEvent.click(screen.getByText("Pause"));

    expect(mockPauseTimer).toHaveBeenCalled();
  });

  test("shows resume button when paused", () => {
    mockTimerState = {
      ...mockTimerState,
      hasStarted: true,
      isRunning: false,
    };

    render(<Timer />);

    expect(screen.getByText("Resume")).toBeInTheDocument();
  });

  test("calls resumeTimer when Resume clicked", () => {
    mockTimerState = {
      ...mockTimerState,
      hasStarted: true,
      isRunning: false,
    };

    render(<Timer />);

    fireEvent.click(screen.getByText("Resume"));

    expect(mockResumeTimer).toHaveBeenCalled();
  });

  test("calls stopTimer when Stop clicked", () => {
    mockTimerState = {
      ...mockTimerState,
      hasStarted: true,
    };

    render(<Timer />);

    fireEvent.click(screen.getByText("Stop"));

    expect(mockStopTimer).toHaveBeenCalled();
  });

  test("renders countdown display when started", () => {
    mockTimerState = {
      ...mockTimerState,
      hasStarted: true,
      time: { hours: 0, minutes: 1, seconds: 5 },
    };

    render(<Timer />);

    expect(screen.getByText("00:01:05")).toBeInTheDocument();
  });
});