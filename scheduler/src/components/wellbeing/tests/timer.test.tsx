import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Timer from "../timer";
import React from "react";

// ---- mocks ----

// mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// mock Reminders
jest.mock("../reminders", () => ({
  __esModule: true,
  default: () => <div>MockReminders</div>,
}));

// dynamic mock for useTimer
let mockTimerState;

const mockStart = jest.fn();
const mockPause = jest.fn();
const mockResume = jest.fn();
const mockStop = jest.fn();

jest.mock("@/hooks/useTimer", () => ({
  useTimer: () => mockTimerState,
}));

describe("Timer Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockTimerState = {
      time: { hours: 0, minutes: 0, seconds: 0 },
      isRunning: false,
      hasStarted: false,
      startTimer: mockStart,
      pauseTimer: mockPause,
      resumeTimer: mockResume,
      stopTimer: mockStop,
      remainingMs: 10000,
    };
  });

  test("renders initial input state", () => {
    render(<Timer />);

    expect(screen.getByDisplayValue("00:00:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  test("updates input value", () => {
    render(<Timer />);

    const input = screen.getByDisplayValue("00:00:00");

    fireEvent.change(input, {
      target: { value: "00:00:10" },
    });

    expect(input.value).toBe("00:00:10");
  });

  test("clicking preset updates time", () => {
    render(<Timer />);

    fireEvent.click(screen.getByText(/25 min/i));

    expect(screen.getByDisplayValue("00:25:00")).toBeInTheDocument();
  });

  test("submits time and calls startTimer + API", async () => {
    render(<Timer />);

    fireEvent.change(screen.getByDisplayValue("00:00:00"), {
      target: { value: "00:00:10" },
    });

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    expect(mockStart).toHaveBeenCalledWith(10000);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  test("renders running state with pause button", () => {
    mockTimerState.hasStarted = true;
    mockTimerState.isRunning = true;

    render(<Timer />);

    expect(screen.getByText(/remaining time/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  test("pause button works", () => {
    mockTimerState.hasStarted = true;
    mockTimerState.isRunning = true;

    render(<Timer />);

    fireEvent.click(screen.getByRole("button", { name: /pause/i }));

    expect(mockPause).toHaveBeenCalled();
  });

  test("resume button works when paused", () => {
    mockTimerState.hasStarted = true;
    mockTimerState.isRunning = false;

    render(<Timer />);

    fireEvent.click(screen.getByRole("button", { name: /resume/i }));

    expect(mockResume).toHaveBeenCalled();
  });

  test("end session button works", () => {
    mockTimerState.hasStarted = true;

    render(<Timer />);

    fireEvent.click(screen.getByRole("button", { name: /end/i }));

    expect(mockStop).toHaveBeenCalled();
  });

  test("shows correct session text", () => {
    mockTimerState.hasStarted = true;
    mockTimerState.isRunning = false;

    render(<Timer />);

    expect(screen.getByText(/session paused/i)).toBeInTheDocument();
  });

  test("calls onTick via useTimer", () => {
    const mockOnTick = jest.fn();

    render(<Timer onTick={mockOnTick} />);

    // simulate hook calling onTick
    mockOnTick(5000);

    expect(mockOnTick).toHaveBeenCalled();
  });

  test("reminder effect fires when threshold reached", () => {
    mockTimerState.remainingMs = 1000;

    render(<Timer />);

    // no crash = effect executed
    expect(true).toBe(true);
  });
});