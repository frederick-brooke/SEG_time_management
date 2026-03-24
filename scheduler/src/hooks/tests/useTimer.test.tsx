import { renderHook, act } from "@testing-library/react";
import { useTimer } from "../useTimer";

describe("useTimer Hook", () => {
  const STORAGE_KEY = "test_timer";

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Date, "now").mockReturnValue(100000);
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // -------------------------------------------------
  // START TIMER
  // -------------------------------------------------

  test("starts timer and counts down correctly", () => {
    const onTickMock = jest.fn();

    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY, onTick: onTickMock })
    );

    act(() => {
      result.current.startTimer(5000);
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.hasStarted).toBe(true);

    // advance 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTickMock).toHaveBeenCalledWith(4000);
    expect(result.current.time.seconds).toBe(4);
  });

  // -------------------------------------------------
  // STOPS AT ZERO
  // -------------------------------------------------

  test("stops at zero", () => {
    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    act(() => {
      result.current.startTimer(2000);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.remainingMs).toBe(0);
  });

  // -------------------------------------------------
  // PAUSE
  // -------------------------------------------------

  test("pauses timer correctly", () => {
    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    act(() => {
      result.current.startTimer(5000);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.pauseTimer();
    });

    expect(result.current.isRunning).toBe(false);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.isRunning).toBe(false);
    expect(saved.remainingMs).toBe(3000);
  });

  // -------------------------------------------------
  // RESUME
  // -------------------------------------------------

  test("resumes paused timer", () => {
    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    act(() => {
      result.current.startTimer(4000);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      result.current.pauseTimer();
      result.current.resumeTimer();
    });

    expect(result.current.isRunning).toBe(true);
  });

  // -------------------------------------------------
  // STOP
  // -------------------------------------------------

  test("stops and resets timer", () => {
    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    act(() => {
      result.current.startTimer(4000);
      result.current.stopTimer();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.hasStarted).toBe(false);
    expect(result.current.time.seconds).toBe(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  // -------------------------------------------------
  // RESTORE FROM RUNNING STATE
  // -------------------------------------------------

  test("restores running timer from localStorage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        endTime: 105000,
        remainingMs: 5000,
        isRunning: true,
      })
    );

    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    expect(result.current.hasStarted).toBe(true);
  });

  // -------------------------------------------------
  // RESTORE FROM PAUSED STATE
  // -------------------------------------------------

  test("restores paused timer from localStorage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        endTime: null,
        remainingMs: 3000,
        isRunning: false,
      })
    );

    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    expect(result.current.hasStarted).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });
});