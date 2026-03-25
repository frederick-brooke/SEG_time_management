// useUndoDelete.test.ts
import { renderHook, act } from "@testing-library/react";
import { useUndoDelete } from "../useUndoDelete";
import { restoreEvent } from "../undoApi";

jest.mock("../undoApi");
jest.useFakeTimers();

const mockRestoreEvent = restoreEvent as jest.Mock;

const MOCK_EVENT = { id: "1", title: "Team Meeting" };

beforeEach(() => {
  jest.clearAllMocks();
  mockRestoreEvent.mockResolvedValue({ ok: true });
});

function setup() {
  const refreshEvents = jest.fn().mockResolvedValue([]);
  const { result } = renderHook(() => useUndoDelete(refreshEvents));
  return { result, refreshEvents };
}

// ── initial state ─────────────────────────────────────────────────────────

describe("initial state", () => {
  it("starts with undo banner hidden", () => {
    const { result } = setup();
    expect(result.current.showUndo).toBe(false);
  });
});

// ── triggerUndo ───────────────────────────────────────────────────────────

describe("triggerUndo", () => {
  it("shows the undo banner", () => {
    const { result } = setup();
    act(() => { result.current.triggerUndo(MOCK_EVENT); });
    expect(result.current.showUndo).toBe(true);
  });

  it("hides the undo banner after 8 seconds", () => {
    const { result } = setup();
    act(() => { result.current.triggerUndo(MOCK_EVENT); });
    act(() => { jest.advanceTimersByTime(8000); });
    expect(result.current.showUndo).toBe(false);
  });

  it("resets the 8-second timer when called again", () => {
    const { result } = setup();
    act(() => { result.current.triggerUndo(MOCK_EVENT); });
    act(() => { jest.advanceTimersByTime(4000); });
    act(() => { result.current.triggerUndo(MOCK_EVENT); });
    act(() => { jest.advanceTimersByTime(4000); });
    expect(result.current.showUndo).toBe(true);
  });
});

// ── handleUndo ────────────────────────────────────────────────────────────

describe("handleUndo", () => {
  it("does nothing when no event has been deleted", async () => {
    const { result } = setup();
    await act(async () => { await result.current.handleUndo(); });
    expect(mockRestoreEvent).not.toHaveBeenCalled();
  });

  it("calls restoreEvent with the last deleted event", async () => {
    const { result } = setup();
    act(() => { result.current.triggerUndo(MOCK_EVENT); });
    await act(async () => { await result.current.handleUndo(); });
    expect(mockRestoreEvent).toHaveBeenCalledWith(MOCK_EVENT);
  });

  it("hides the undo banner after restoring", async () => {
    const { result } = setup();
    act(() => { result.current.triggerUndo(MOCK_EVENT); });
    await act(async () => { await result.current.handleUndo(); });
    expect(result.current.showUndo).toBe(false);
  });

  it("calls refreshEvents after restoring", async () => {
    const { result, refreshEvents } = setup();
    act(() => { result.current.triggerUndo(MOCK_EVENT); });
    await act(async () => { await result.current.handleUndo(); });
    expect(refreshEvents).toHaveBeenCalled();
  });
});

// ── dismissUndo ───────────────────────────────────────────────────────────

describe("dismissUndo", () => {
  it("hides the undo banner", () => {
    const { result } = setup();
    act(() => { result.current.triggerUndo(MOCK_EVENT); });
    act(() => { result.current.dismissUndo(); });
    expect(result.current.showUndo).toBe(false);
  });
});