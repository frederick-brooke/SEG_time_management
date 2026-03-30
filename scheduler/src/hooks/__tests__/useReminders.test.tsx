import { renderHook, act } from "@testing-library/react";
import { useReminders } from "../useReminders";

describe("useReminders", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("initial state is correct", () => {
    const { result } = renderHook(() =>
      useReminders({ id: "task1", onFire: jest.fn() })
    );

    expect(result.current.enabled).toBe(false);
    expect(result.current.durationMs).toBe(null);
    expect(result.current.remainingMs).toBe(null);
  });

  test("startReminderTimer starts timer and updates remaining time", () => {
    const onFire = jest.fn();

    const { result } = renderHook(() =>
      useReminders({ id: "task1", onFire })
    );

    act(() => {
      result.current.startReminderTimer(5000);
    });

    expect(result.current.remainingMs).toBe(5000);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.remainingMs).toBeLessThanOrEqual(4000);
  });

  test("timer fires and calls onFire", () => {
    const onFire = jest.fn();

    const { result } = renderHook(() =>
      useReminders({ id: "task1", onFire })
    );

    act(() => {
      result.current.startReminderTimer(2000);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onFire).toHaveBeenCalled();
    expect(result.current.enabled).toBe(false);
  });

  test("handleToggleClick enables reminder", () => {
    const { result } = renderHook(() =>
      useReminders({ id: "task1", onFire: jest.fn() })
    );

    act(() => {
      result.current.setDurationMs(3000);
    });

    act(() => {
      result.current.handleToggleClick();
    });

    expect(result.current.enabled).toBe(true);
  });

  test("handleToggleClick disables reminder", () => {
    const { result } = renderHook(() =>
      useReminders({ id: "task1", onFire: jest.fn() })
    );

    act(() => {
      result.current.setDurationMs(3000);
    });

    act(() => {
      result.current.handleToggleClick();
    });

    act(() => {
      result.current.handleToggleClick();
    });

    expect(result.current.enabled).toBe(false);
    expect(result.current.remainingMs).toBe(null);
  });

  test("disable function stops reminder", () => {
    const { result } = renderHook(() =>
      useReminders({ id: "task1", onFire: jest.fn() })
    );

    act(() => {
      result.current.setDurationMs(3000);
      result.current.handleToggleClick();
    });

    act(() => {
      result.current.disable();
    });

    expect(result.current.enabled).toBe(false);
    expect(result.current.remainingMs).toBe(null);
  });

  test("persists reminder config to localStorage", () => {
    const { result } = renderHook(() =>
      useReminders({ id: "task1", onFire: jest.fn() })
    );

    act(() => {
      result.current.setDurationMs(4000);
    });

    act(() => {
      result.current.handleToggleClick();
    });

    const stored = JSON.parse(localStorage.getItem("reminder:task1")!);

    expect(stored.durationMs).toBe(4000);
    expect(stored.enabled).toBe(true);
  });

  test("restores reminder from localStorage", () => {
    const fireAt = Date.now() + 5000;

    localStorage.setItem(
      "reminder:task1",
      JSON.stringify({
        durationMs: 5000,
        enabled: true,
        fireAt,
      })
    );

    const { result } = renderHook(() =>
      useReminders({ id: "task1", onFire: jest.fn() })
    );

    expect(result.current.durationMs).toBe(5000);
    expect(result.current.enabled).toBe(true);
  });

  test("cleanup clears timers on unmount", () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    const { result, unmount } = renderHook(() =>
      useReminders({ id: "task1", onFire: jest.fn() })
    );

    act(() => {
      result.current.startReminderTimer(5000);
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});

