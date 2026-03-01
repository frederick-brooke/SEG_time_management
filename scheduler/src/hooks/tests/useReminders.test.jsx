// src/hooks/tests/useReminders.test.jsx
import { renderHook, act } from "@testing-library/react";
import { useReminders } from "../useReminders";

jest.useFakeTimers();

describe("useReminders hook", () => {
  const mockOnFire = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("initial state is correct", () => {
    const { result } = renderHook(() => useReminders({ id: "1", onFire: mockOnFire }));
    expect(result.current.durationMs).toBeNull();
    expect(result.current.enabled).toBe(false);
    expect(result.current.remainingMs).toBeNull();
  });

  test("handleToggleClick enables timer if disabled", () => {
    const { result } = renderHook(() => useReminders({ id: "1", onFire: mockOnFire }));

    act(() => {
      result.current.setDurationMs(3000);
    });

    act(() => {
      result.current.handleToggleClick(); // enable
    });

    // React state update flush
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current.enabled).toBe(true);
    expect(result.current.remainingMs).toBe(3000);

    // Timer should fire after 3s
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockOnFire).toHaveBeenCalled();
    expect(result.current.enabled).toBe(false);
    expect(result.current.remainingMs).toBeNull();
  });

  test("handleToggleClick disables timer if enabled", () => {
    const { result } = renderHook(() => useReminders({ id: "1", onFire: mockOnFire }));

    act(() => {
      result.current.setDurationMs(3000);
      result.current.handleToggleClick(); // enable
    });

    act(() => {
      jest.advanceTimersByTime(0); // flush state
    });

    expect(result.current.enabled).toBe(true);

    act(() => {
      result.current.handleToggleClick(); // disable
    });

    act(() => {
      jest.advanceTimersByTime(0); // flush state
    });

    expect(result.current.enabled).toBe(false);
    expect(result.current.remainingMs).toBeNull();
  });

  test("disable function stops timer and clears state", () => {
    const { result } = renderHook(() => useReminders({ id: "1", onFire: mockOnFire }));

    act(() => {
      result.current.setDurationMs(4000);
      result.current.handleToggleClick(); // enable
    });

    act(() => {
      result.current.disable();
    });

    expect(result.current.enabled).toBe(false);
    expect(result.current.remainingMs).toBeNull();
  });

  test("persists to localStorage when enabled and duration set", () => {
    const { result } = renderHook(() => useReminders({ id: "123", onFire: mockOnFire }));

    act(() => {
      result.current.setDurationMs(5000);
      result.current.handleToggleClick(); // enable
    });

    act(() => {
      jest.advanceTimersByTime(0); // flush useEffect for localStorage
    });

    const stored = JSON.parse(localStorage.getItem("reminder:123"));
    expect(stored.durationMs).toBe(5000);
    expect(stored.enabled).toBe(true);
    expect(stored.fireAt).toBeGreaterThan(Date.now());
  });

  test("restores from localStorage on mount", () => {
    const now = Date.now();
    localStorage.setItem(
      "reminder:999",
      JSON.stringify({ durationMs: 3000, enabled: true, fireAt: now + 5000 })
    );

    const { result } = renderHook(() => useReminders({ id: "999", onFire: mockOnFire }));

    act(() => {
      jest.advanceTimersByTime(0); // flush restore effect
    });

    expect(result.current.durationMs).toBe(3000);
    expect(result.current.enabled).toBe(true);
    expect(result.current.remainingMs).toBeGreaterThan(0);
  });
});