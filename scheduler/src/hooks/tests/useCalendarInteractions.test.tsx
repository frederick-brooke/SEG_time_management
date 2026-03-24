import { renderHook, act, waitFor } from "@testing-library/react";


const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockConfirm = jest.fn();
global.confirm = mockConfirm;

const mockAlert = jest.fn();
global.alert = mockAlert;

jest.mock("@/lib/ui", () => ({
  taskToFormData: jest.fn((task: any) => ({
    name: task.title || "",
    description: task.description || "",
    dueDate: null,
    url: "",
    subtasks: "",
    durationHours: "0",
    durationMinutes: "0",
    examId: "none",
    priority: "Medium",
    bufferDays: 0,
    isRecurring: false,
    recurrence: null,
  })),
}));

import { useCalendarInteractions } from "../useCalendarInteractions";


const okJson = (data: any) =>
  Promise.resolve({ ok: true, json: async () => data });

const failRes = () =>
  Promise.resolve({ ok: false, json: async () => ({ message: "Failed" }) });

const makeEvent = (id = "evt-1", overrides: any = {}) => ({
  id,
  title: "Test Event",
  description: "Desc",
  category: "Work",
  start: new Date("2025-01-01T10:00:00Z"),
  end: new Date("2025-01-01T11:00:00Z"),
  allDay: false,
  recurrence: { type: "none" },
  ...overrides,
});

const makeTask = (id = "task-1", overrides: any = {}) => ({
  id,
  title: "Test Task",
  description: "",
  priority: "Medium",
  ...overrides,
});

const mockRefreshEvents = jest.fn().mockResolvedValue([]);
const mockRefreshTasks = jest.fn().mockResolvedValue([]);


describe("useCalendarInteractions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue(okJson([]));
    mockConfirm.mockReturnValue(true);
  });

  // Initial state
  it("initialises showUndo as false", () => {
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    expect(result.current.showUndo).toBe(false);
  });

  it("initialises searchQuery as empty string", () => {
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    expect(result.current.searchQuery).toBe("");
  });

  it("initialises isTaskEditOpen as false", () => {
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    expect(result.current.isTaskEditOpen).toBe(false);
  });

  // handleUndo
  it("handleUndo does nothing when lastDeleted is null", async () => {
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => { await result.current.handleUndo(); });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("dismissUndo sets showUndo to false", async () => {
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => { result.current.dismissUndo(); });
    expect(result.current.showUndo).toBe(false);
  });

  // handleSearch
  it("handleSearch clears results when query is empty", async () => {
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => { await result.current.handleSearch(""); });
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.showSearchResults).toBe(false);
  });

  it("handleSearch fetches from /api/calendar/events with query", async () => {
    mockFetch.mockResolvedValueOnce(okJson([]));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => { await result.current.handleSearch("test"); });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/calendar/events?q=test"
    );
  });

  it("handleSearch sets showSearchResults to true when query is non-empty", async () => {
    mockFetch.mockResolvedValueOnce(okJson([]));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => { await result.current.handleSearch("test"); });
    expect(result.current.showSearchResults).toBe(true);
  });

  it("handleSearch converts start/end strings to Date objects", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson([{ id: "e1", start: "2025-01-01T10:00:00Z", end: "2025-01-01T11:00:00Z" }])
    );
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => { await result.current.handleSearch("test"); });
    expect(result.current.searchResults[0].start).toBeInstanceOf(Date);
  });

  // clearSearch
  it("clearSearch resets search state", async () => {
    mockFetch.mockResolvedValueOnce(okJson([]));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => { await result.current.handleSearch("test"); });
    act(() => { result.current.clearSearch(); });
    expect(result.current.searchQuery).toBe("");
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.showSearchResults).toBe(false);
  });

  // deleteEvent
  it("deleteEvent shows alert and returns false for invalid id", async () => {
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    const res = await act(async () =>
      result.current.deleteEvent({ id: "invalid-id", start: new Date() }, "single")
    );
    expect(mockAlert).toHaveBeenCalled();
    expect(res).toBe(false);
  });

  it("deleteEvent returns false when user cancels confirm", async () => {
    mockConfirm.mockReturnValue(false);
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    const res = await act(async () =>
      result.current.deleteEvent(makeEvent("a1b2c3d4e5f6a1b2c3d4e5f6"), "single")
    );
    expect(res).toBe(false);
  });

  it("deleteEvent sends DELETE request with correct params", async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () =>
      result.current.deleteEvent(makeEvent("a1b2c3d4e5f6a1b2c3d4e5f6"), "single")
    );
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/calendar/events");
    expect(url).toContain("id=a1b2c3d4e5f6a1b2c3d4e5f6");
  });

  it("deleteEvent returns true on success", async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    const res = await act(async () =>
      result.current.deleteEvent(makeEvent("a1b2c3d4e5f6a1b2c3d4e5f6"), "single")
    );
    expect(res).toBe(true);
  });

  it("deleteEvent calls refreshEvents after successful delete", async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () =>
      result.current.deleteEvent(makeEvent("a1b2c3d4e5f6a1b2c3d4e5f6"), "series")
    );
    expect(mockRefreshEvents).toHaveBeenCalled();
  });

  it("deleteEvent returns false and alerts when DELETE fails", async () => {
    mockFetch.mockResolvedValueOnce(failRes());
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    const res = await act(async () =>
      result.current.deleteEvent(makeEvent("a1b2c3d4e5f6a1b2c3d4e5f6"), "single")
    );
    expect(res).toBe(false);
    expect(mockAlert).toHaveBeenCalled();
  });

  // deleteTask
  it("deleteTask returns false when user cancels confirm", async () => {
    mockConfirm.mockReturnValue(false);
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    const res = await act(async () =>
      result.current.deleteTask("task-1")
    );
    expect(res).toBe(false);
  });

  it("deleteTask sends DELETE to correct URL", async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => { await result.current.deleteTask("task-1"); });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tasks/task-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("deleteTask returns true on success", async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    const res = await act(async () => result.current.deleteTask("task-1"));
    expect(res).toBe(true);
  });

  it("deleteTask calls refreshTasks after deletion", async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => { await result.current.deleteTask("task-1"); });
    expect(mockRefreshTasks).toHaveBeenCalled();
  });

  // openTaskEdit
  it("openTaskEdit sets isTaskEditOpen to true", () => {
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    act(() => { result.current.openTaskEdit(makeTask()); });
    expect(result.current.isTaskEditOpen).toBe(true);
  });

  it("openTaskEdit populates taskFormData from the task", () => {
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    act(() => { result.current.openTaskEdit(makeTask("t1", { title: "My Task" })); });
    expect(result.current.taskFormData.name).toBe("My Task");
  });

  // submitTaskEdit
  it("submitTaskEdit sends PATCH to correct URL", async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => {
      await result.current.submitTaskEdit("task-1", {
        name: "Updated",
        description: "",
        dueDate: null,
        url: "",
        subtasks: "",
        durationHours: "1",
        durationMinutes: "30",
        examId: "none",
        priority: "High",
        bufferDays: 0,
        isRecurring: false,
        recurrence: null,
      });
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tasks/task-1",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("submitTaskEdit closes the task edit form", async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    act(() => { result.current.openTaskEdit(makeTask()); });
    await act(async () => {
      await result.current.submitTaskEdit("task-1", {
        name: "Updated",
        description: "",
        dueDate: null,
        url: "",
        subtasks: "",
        durationHours: "0",
        durationMinutes: "0",
        examId: "none",
        priority: "Medium",
        bufferDays: 0,
        isRecurring: false,
        recurrence: null,
      });
    });
    expect(result.current.isTaskEditOpen).toBe(false);
  });

  it("submitTaskEdit calls refreshTasks after save", async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => {
      await result.current.submitTaskEdit("task-1", {
        name: "Updated",
        description: "",
        dueDate: null,
        url: "",
        subtasks: "a, b",
        durationHours: "0",
        durationMinutes: "30",
        examId: "none",
        priority: "Low",
        bufferDays: 1,
        isRecurring: false,
        recurrence: null,
      });
    });
    expect(mockRefreshTasks).toHaveBeenCalled();
  });

  it("submitTaskEdit computes duration as hours * 60 + minutes", async () => {
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useCalendarInteractions([], mockRefreshEvents, mockRefreshTasks)
    );
    await act(async () => {
      await result.current.submitTaskEdit("task-1", {
        name: "Updated",
        description: "",
        dueDate: null,
        url: "",
        subtasks: "",
        durationHours: "1",
        durationMinutes: "30",
        examId: "none",
        priority: "Medium",
        bufferDays: 0,
        isRecurring: false,
        recurrence: null,
      });
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.duration).toBe(90);
  });
});
