import { renderHook, act } from "@testing-library/react";
import { useTimer } from "../useTimer";

describe("useTimer", () => {
  const STORAGE_KEY = "test-timer";

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1000); 
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useTimer());

    expect(result.current.remainingMs).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.hasStarted).toBe(false);
  });

  it("pauses and resumes a timer", () => {
    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    act(() => {
      result.current.startTimer(5000);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
      jest.setSystemTime(2000);
    });

    act(() => {
      result.current.pauseTimer();
    });

    const pausedTime = result.current.remainingMs;
    expect(pausedTime).toBeLessThan(5000);

    act(() => {
      result.current.resumeTimer();
    });

    act(() => {
      jest.advanceTimersByTime(1000);
      jest.setSystemTime(3000);
    });

    expect(result.current.remainingMs).toBeLessThan(pausedTime);
  });

  it("stops the timer manually", () => {
    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    act(() => {
      result.current.startTimer(5000);
    });

    act(() => {
      result.current.stopTimer();
    });

    expect(result.current.remainingMs).toBe(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("restores a running timer from storage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        endTime: 6000,
        remainingMs: 5000,
        isRunning: true,
      })
    );

    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    expect(result.current.isRunning).toBe(true);
  });

  it("restores a paused timer from storage", () => {
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

    expect(result.current.remainingMs).toBe(3000);
    expect(result.current.hasStarted).toBe(true);
  });

  it("does nothing if resume is called with 0 time", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.resumeTimer();
    });

    expect(result.current.isRunning).toBe(false);
  });

  it("handles invalid JSON in storage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "invalid-json");

    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    expect(result.current.remainingMs).toBe(0);
  });

  it("writes to localStorage on start and pause", () => {
    const { result } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    act(() => {
      result.current.startTimer(5000);
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).isRunning).toBe(true);

    act(() => {
      result.current.pauseTimer();
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      isRunning: false,
    });
  });

  it("cleans up interval on unmount", () => {
    const clearSpy = jest.spyOn(global, "clearInterval");

    const { result, unmount } = renderHook(() =>
      useTimer({ storageKey: STORAGE_KEY })
    );

    act(() => {
      result.current.startTimer(5000);
    });

    unmount();

    expect(clearSpy).toHaveBeenCalled();
  });
});