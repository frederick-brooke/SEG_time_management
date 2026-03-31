import { renderHook, act, waitFor } from "@testing-library/react";
import { useReminders } from "@/hooks/useReminders";

//  timer + storage mocks 

beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    jest.clearAllMocks();
});

afterEach(() => {
    jest.useRealTimers();
});

const renderReminder = (id = "test", onFire?: jest.Mock) =>
    renderHook(() => useReminders({ id, onFire }));

//  initial state 

describe("initial state", () => {
    it("returns correct defaults with no stored data", () => {
        const { result } = renderReminder();

        expect(result.current.enabled).toBe(false);
        expect(result.current.durationMs).toBeNull();
        expect(result.current.remainingMs).toBeNull();
    });
});

//  setDurationMs 

describe("setDurationMs", () => {
    it("updates durationMs", () => {
        const { result } = renderReminder();

        act(() => { result.current.setDurationMs(5000); });

        expect(result.current.durationMs).toBe(5000);
    });
});

//  toggleReminder 

describe("toggleReminder", () => {
    it("does nothing if durationMs is null", () => {
        const { result } = renderReminder();

        act(() => { result.current.toggleReminder(); });

        expect(result.current.enabled).toBe(false);
    });

    it("enables the reminder and starts countdown", () => {
        const { result } = renderReminder();

        act(() => { result.current.setDurationMs(5000); });
        act(() => { result.current.toggleReminder(); });

        expect(result.current.enabled).toBe(true);
        expect(result.current.remainingMs).toBe(5000);
    });

    it("disables the reminder when toggled off", () => {
        const { result } = renderReminder();

        act(() => { result.current.setDurationMs(5000); });
        act(() => { result.current.toggleReminder(); });
        act(() => { result.current.toggleReminder(); });

        expect(result.current.enabled).toBe(false);
        expect(result.current.remainingMs).toBeNull();
    });
});

//  countdown interval 

describe("countdown interval", () => {
    it("decrements remainingMs each second", () => {
        const { result } = renderReminder();

        act(() => { result.current.setDurationMs(5000); });
        act(() => { result.current.toggleReminder(); });
        act(() => { jest.advanceTimersByTime(2000); });

        expect(result.current.remainingMs).toBeLessThanOrEqual(3000);
    });
});

//  onFire callback 

describe("onFire", () => {
    it("calls onFire when timer completes", () => {
        const onFire = jest.fn();
        const { result } = renderHook(() => useReminders({ id: "fire-test", onFire }));

        act(() => { result.current.setDurationMs(3000); });
        act(() => { result.current.toggleReminder(); });
        act(() => { jest.advanceTimersByTime(3000); });

        expect(onFire).toHaveBeenCalledTimes(1);
    });

    it("disables after firing", () => {
        const onFire = jest.fn();
        const { result } = renderHook(() => useReminders({ id: "fire-disable", onFire }));

        act(() => { result.current.setDurationMs(2000); });
        act(() => { result.current.toggleReminder(); });
        act(() => { jest.advanceTimersByTime(2000); });

        expect(result.current.enabled).toBe(false);
        expect(result.current.remainingMs).toBeNull();
    });

    it("does not throw if onFire is undefined", () => {
        const { result } = renderReminder("no-fire-cb");

        act(() => { result.current.setDurationMs(1000); });
        act(() => { result.current.toggleReminder(); });

        expect(() => act(() => { jest.advanceTimersByTime(1000); })).not.toThrow();
    });
});

//  disable 

describe("disable", () => {
    it("clears enabled and remainingMs", () => {
        const { result } = renderReminder();

        act(() => { result.current.setDurationMs(5000); });
        act(() => { result.current.toggleReminder(); });
        act(() => { result.current.disable(); });

        expect(result.current.enabled).toBe(false);
        expect(result.current.remainingMs).toBeNull();
    });
});

//  localStorage persistence 

describe("localStorage persistence", () => {
    it("writes to localStorage when durationMs is set", () => {
        const { result } = renderReminder("persist-test");

        act(() => { result.current.setDurationMs(5000); });

        const stored = JSON.parse(localStorage.getItem("reminder:persist-test")!);
        expect(stored.durationMs).toBe(5000);
    });

    it("persists enabled=true when timer is running", () => {
        const { result } = renderReminder("persist-enabled");

        act(() => { result.current.setDurationMs(5000); });
        act(() => { result.current.toggleReminder(); });

        const stored = JSON.parse(localStorage.getItem("reminder:persist-enabled")!);
        expect(stored.enabled).toBe(true);
        expect(stored.fireAt).toBeGreaterThan(Date.now());
    });

    it("persists enabled=false and null fireAt when disabled", () => {
        const { result } = renderReminder("persist-disabled");

        act(() => { result.current.setDurationMs(5000); });
        act(() => { result.current.toggleReminder(); });
        act(() => { result.current.disable(); });

        const stored = JSON.parse(localStorage.getItem("reminder:persist-disabled")!);
        expect(stored.enabled).toBe(false);
        expect(stored.fireAt).toBeNull();
    });

    it("does not write to localStorage if durationMs is null", () => {
        renderReminder("no-write");
        expect(localStorage.getItem("reminder:no-write")).toBeNull();
    });
});

//  restore from localStorage 

describe("restore from localStorage", () => {
    it("restores durationMs from storage", () => {
        localStorage.setItem("reminder:restore-duration", JSON.stringify({
            durationMs: 8000, enabled: false, fireAt: null,
        }));

        const { result } = renderHook(() => useReminders({ id: "restore-duration", onFire: undefined }));

        expect(result.current.durationMs).toBe(8000);
    });

    it("resumes active reminder if fireAt is in the future", async () => {
        const fireAt = Date.now() + 10000;
        localStorage.setItem("reminder:restore-active", JSON.stringify({
            durationMs: 10000, enabled: true, fireAt,
        }));

        const { result } = renderHook(() => useReminders({ id: "restore-active", onFire: undefined }));

        await waitFor(() => expect(result.current.enabled).toBe(true));
        expect(result.current.remainingMs).toBeGreaterThan(0);
    });

    it("does not resume if fireAt is in the past", () => {
        localStorage.setItem("reminder:restore-expired", JSON.stringify({
            durationMs: 5000, enabled: true, fireAt: Date.now() - 1000,
        }));

        const { result } = renderHook(() => useReminders({ id: "restore-expired", onFire: undefined }));

        expect(result.current.enabled).toBe(false);
    });

    it("does not resume if enabled=false", () => {
        localStorage.setItem("reminder:restore-disabled", JSON.stringify({
            durationMs: 5000, enabled: false, fireAt: Date.now() + 5000,
        }));

        const { result } = renderHook(() => useReminders({ id: "restore-disabled", onFire: undefined }));

        expect(result.current.enabled).toBe(false);
    });

    it("does not resume if fireAt is null", () => {
        localStorage.setItem("reminder:restore-null-fire", JSON.stringify({
            durationMs: 5000, enabled: true, fireAt: null,
        }));

        const { result } = renderHook(() => useReminders({ id: "restore-null-fire", onFire: undefined }));

        expect(result.current.enabled).toBe(false);
    });

    it("handles malformed localStorage data gracefully", () => {
        localStorage.setItem("reminder:restore-bad", "not-valid-json{{");

        expect(() => renderHook(() => useReminders({ id: "restore-bad", onFire: undefined }))).not.toThrow();
    });
});

describe("cleanup", () => {
    it("clears timers on unmount", () => {
        const clearTimeoutSpy  = jest.spyOn(global, "clearTimeout");
        const clearIntervalSpy = jest.spyOn(global, "clearInterval");

        const { result, unmount } = renderReminder("cleanup-test");

        act(() => { result.current.setDurationMs(5000); });
        act(() => { result.current.toggleReminder(); });
        unmount();

        expect(clearTimeoutSpy).toHaveBeenCalled();
        expect(clearIntervalSpy).toHaveBeenCalled();
    });
});