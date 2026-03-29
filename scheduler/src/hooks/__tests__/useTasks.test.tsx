// src/hooks/__tests__/useTasks.test.ts
import { renderHook, act, waitFor } from "@testing-library/react";

const createNotificationMock = jest.fn().mockResolvedValue(undefined);

jest.mock("@/app/actions/notifications", () => ({
  createNotification: (...a: any[]) => createNotificationMock(...a),
}));

jest.mock("@prisma/client", () => ({
  NotificationType: { INFO: "INFO", SUCCESS: "SUCCESS" },
}));

import { useTasks } from "../useTasks";

function mockFetch(response: any, ok = true) {
  return jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    json: jest.fn().mockResolvedValue(response), // Keep for backward compatibility with existing tests
  });
}

const BASE_TASK = {
  id: "t1",
  title: "Task One",
  description: "Desc",
  dueDate: "2025-07-01T00:00:00.000Z",
  url: "https://example.com",
  subtasks: ["sub1", "sub2"],
  duration: 90,
  priority: "High",
  status: "todo",
  completed: false,
  examId: "exam1",
  bufferDays: 2,
  isRecurring: false,
  recurrence: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch = mockFetch({ tasks: [BASE_TASK] });
});

afterEach(() => jest.restoreAllMocks());

describe("useTasks", () => {

  it("initialises with empty tasks and isLoading true", () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTasks("u1"));
    expect(result.current.tasks).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it("fetches tasks on mount when userId is provided", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([BASE_TASK]);
    expect(fetch).toHaveBeenCalledWith("/api/tasks?userId=u1");
  });

  it("does not fetch when userId is absent", async () => {
    const { result } = renderHook(() => useTasks(null));
    // fetchTasks returns early without calling setIsLoading(false) when userId
    // is null, so isLoading stays true — just verify no network call was made
    await new Promise((r) => setTimeout(r, 50));
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.tasks).toEqual([]);
  });

  it("logs error and finishes loading when fetch throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(console.error).toHaveBeenCalled();
    expect(result.current.tasks).toEqual([]);
  });

  it("logs warning when API returns non-ok status", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue("")
    });
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("status 500"));
    consoleWarnSpy.mockRestore();
  });

  it("handles empty response body gracefully", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("")
    });
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Empty response body"));
    expect(result.current.tasks).toEqual([]);
    consoleWarnSpy.mockRestore();
  });

  it("handles malformed JSON gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("invalid json {")
    });
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to parse JSON"), expect.any(SyntaxError));
    expect(result.current.tasks).toEqual([]);
    consoleErrorSpy.mockRestore();
  });

  it("does not update tasks when response has no tasks property", async () => {
    global.fetch = mockFetch({});
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it("re-fetches when fetchTasks is called manually", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({ tasks: [{ ...BASE_TASK, id: "t2" }] });
    await act(async () => { await result.current.fetchTasks(); });
    expect(result.current.tasks[0].id).toBe("t2");
  });

  it("createTask prepends the new task to state", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const newTask = { ...BASE_TASK, id: "t99", title: "New Task" };
    global.fetch = mockFetch({ task: newTask }, true);
    await act(async () => { await result.current.createTask({ title: "New Task" }); });
    expect(result.current.tasks[0]).toEqual(newTask);
  });

  it("createTask throws when response is not ok", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({ error: "Bad request" }, false);
    await expect(result.current.createTask({})).rejects.toThrow("Bad request");
  });

  it("createTask throws with Unknown error fallback when no error field", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({}, false);
    await expect(result.current.createTask({})).rejects.toThrow("Unknown error");
  });

  it("createTask throws when response has no task id", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({ task: null }, true);
    await expect(result.current.createTask({})).rejects.toThrow("Invalid response from server");
  });

  it("updateTask replaces the correct task in state using response task", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const updated = { ...BASE_TASK, title: "Updated" };
    global.fetch = mockFetch({ task: updated });
    await act(async () => { await result.current.updateTask("t1", { title: "Updated" }); });
    expect(result.current.tasks.find((t: any) => t.id === "t1")?.title).toBe("Updated");
  });

  it("updateTask falls back to merging local state when response has no task", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({});
    await act(async () => { await result.current.updateTask("t1", { title: "Fallback" }); });
    expect(result.current.tasks.find((t: any) => t.id === "t1")?.title).toBe("Fallback");
  });

  it("deleteTask removes the task from state", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({});
    await act(async () => { await result.current.deleteTask("t1"); });
    expect(result.current.tasks.find((t: any) => t.id === "t1")).toBeUndefined();
  });

  it("toggleTaskStatus transitions todo to in-progress", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({ rewards: null });
    await act(async () => { await result.current.toggleTaskStatus("t1"); });
    expect(result.current.tasks.find((t: any) => t.id === "t1")?.status).toBe("in-progress");
  });

  it("toggleTaskStatus transitions in-progress to todo", async () => {
    global.fetch = mockFetch({ tasks: [{ ...BASE_TASK, status: "in-progress" }] });
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({ rewards: null });
    await act(async () => { await result.current.toggleTaskStatus("t1"); });
    expect(result.current.tasks.find((t: any) => t.id === "t1")?.status).toBe("todo");
  });

  it("toggleTaskStatus transitions completed to in-progress", async () => {
    global.fetch = mockFetch({ tasks: [{ ...BASE_TASK, status: "completed" }] });
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({ rewards: null });
    await act(async () => { await result.current.toggleTaskStatus("t1"); });
    expect(result.current.tasks.find((t: any) => t.id === "t1")?.status).toBe("in-progress");
  });

  it("toggleTaskStatus uses forcedStatus when provided", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({ rewards: 50 });
    await act(async () => { await result.current.toggleTaskStatus("t1", "completed"); });
    expect(result.current.tasks.find((t: any) => t.id === "t1")?.completed).toBe(true);
  });

  it("toggleTaskStatus returns rewards from response", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({ rewards: 100 });
    let rewards: any;
    await act(async () => { rewards = await result.current.toggleTaskStatus("t1"); });
    expect(rewards).toBe(100);
  });

  it("toggleTaskStatus returns null when response has no rewards", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({});
    let rewards: any;
    await act(async () => { rewards = await result.current.toggleTaskStatus("t1"); });
    expect(rewards).toBeNull();
  });

  it("toggleTaskStatus dispatches PROGRESS_SYNC_EVENT after status change", async () => {
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({ rewards: null });
    await act(async () => { await result.current.toggleTaskStatus("t1"); });
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "task-progress-updated" }));
    dispatchEventSpy.mockRestore();
  });

  it("toggleTaskStatus returns null and does nothing when task is not found", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({});
    let rewards: any;
    await act(async () => { rewards = await result.current.toggleTaskStatus("nonexistent"); });
    expect(rewards).toBeNull();
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining("nonexistent"), expect.anything());
  });

  it("toggleTaskStatus does not dispatch event when task is not found", async () => {
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.toggleTaskStatus("nonexistent"); });
    expect(dispatchEventSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: "task-progress-updated" }));
    dispatchEventSpy.mockRestore();
  });

  it("sortTasks orders tasks by priority High > Medium > Low", async () => {
    const tasks = [
      { ...BASE_TASK, id: "a", priority: "Low" },
      { ...BASE_TASK, id: "b", priority: "High" },
      { ...BASE_TASK, id: "c", priority: "Medium" },
    ];
    global.fetch = mockFetch({ tasks });
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.sortTasks(); });
    expect(result.current.tasks.map((t: any) => t.id)).toEqual(["b", "c", "a"]);
  });

  it("handleFormChange merges partial updates into formData", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleFormChange({ name: "New Name" }); });
    expect(result.current.formData.name).toBe("New Name");
    expect(result.current.formData.priority).toBe("Medium");
  });

  it("resetForm clears formData and editingTaskId", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleFormChange({ name: "Something" }); });
    act(() => { result.current.resetForm(); });
    expect(result.current.formData.name).toBe("");
    expect(result.current.editingTaskId).toBeNull();
  });

  it("handleSubmitTask alerts when task name is empty", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.handleSubmitTask({ name: "  " }); });
    expect(window.alert).toHaveBeenCalledWith("Please enter a task name.");
  });

  it("handleSubmitTask creates a task and sends SUCCESS notification", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const newTask = { ...BASE_TASK, id: "tnew" };
    global.fetch = mockFetch({ task: newTask }, true);
    await act(async () => {
      await result.current.handleSubmitTask({
        name: "My Task", description: "", dueDate: "", url: "",
        subtasks: "a, b", durationHours: "1", durationMinutes: "30",
        priority: "Medium", examId: "none", bufferDays: 0,
        isRecurring: false, recurrence: null,
      });
    });
    expect(createNotificationMock).toHaveBeenCalledWith(
      "u1", "Task Created", expect.any(String), "SUCCESS"
    );
    expect(result.current.isDialogOpen).toBe(false);
  });

  it("handleSubmitTask updates a task and sends INFO notification", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleEditTask("t1"); });
    const updated = { ...BASE_TASK, title: "Edited" };
    global.fetch = mockFetch({ task: updated }, true);
    await act(async () => {
      await result.current.handleSubmitTask({ name: "Edited", description: "", dueDate: "",
        url: "", subtasks: "", durationHours: "0", durationMinutes: "0",
        priority: "High", examId: "none", bufferDays: 0, isRecurring: false, recurrence: null,
      });
    });
    expect(createNotificationMock).toHaveBeenCalledWith(
      "u1", "Task Updated", expect.any(String), "INFO"
    );
  });

  it("handleSubmitTask uses formData when no mergedData is passed", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleFormChange({ name: "From State" }); });
    const newTask = { ...BASE_TASK, id: "ts" };
    global.fetch = mockFetch({ task: newTask }, true);
    await act(async () => { await result.current.handleSubmitTask(null); });
    expect(createNotificationMock).toHaveBeenCalled();
  });

  it("handleSubmitTask passes examId as null when value is 'none'", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const newTask = { ...BASE_TASK, id: "tex" };
    global.fetch = mockFetch({ task: newTask }, true);
    await act(async () => {
      await result.current.handleSubmitTask({
        name: "Exam Task", description: "", dueDate: "", url: "",
        subtasks: [], durationHours: "0", durationMinutes: "0",
        priority: "Low", examId: "none", bufferDays: "2",
        isRecurring: true, recurrence: "weekly",
      });
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/tasks",
      expect.objectContaining({ body: expect.stringContaining('"examId":null') })
    );
  });

  it("handleSubmitTask alerts on save error", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({ error: "Server error" }, false);
    await act(async () => {
      await result.current.handleSubmitTask({ name: "Fail Task", description: "", dueDate: "",
        url: "", subtasks: "", durationHours: "0", durationMinutes: "0",
        priority: "Low", examId: "none", bufferDays: 0, isRecurring: false, recurrence: null,
      });
    });
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Failed to save task"));
  });

  it("handleEditTask opens dialog with task data pre-filled", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleEditTask("t1"); });
    expect(result.current.isDialogOpen).toBe(true);
    expect(result.current.editingTaskId).toBe("t1");
    expect(result.current.formData.name).toBe("Task One");
    expect(result.current.formData.durationHours).toBe("1");
    expect(result.current.formData.durationMinutes).toBe("30");
    expect(result.current.formData.subtasks).toBe("sub1, sub2");
  });

  it("handleEditTask handles subtasks as a plain string", async () => {
    global.fetch = mockFetch({ tasks: [{ ...BASE_TASK, subtasks: "raw string" }] });
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleEditTask("t1"); });
    expect(result.current.formData.subtasks).toBe("raw string");
  });

  it("handleEditTask does nothing when task is not found", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleEditTask("missing"); });
    expect(result.current.isDialogOpen).toBe(false);
  });

  it("handleEditTask sets examId to 'none' when task has no examId", async () => {
    global.fetch = mockFetch({ tasks: [{ ...BASE_TASK, examId: null }] });
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleEditTask("t1"); });
    expect(result.current.formData.examId).toBe("none");
  });

  it("handleViewTask sets the viewTask state", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleViewTask(BASE_TASK); });
    expect(result.current.viewTask).toEqual(BASE_TASK);
  });

  it("setViewTask clears the view when set to null", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleViewTask(BASE_TASK); });
    act(() => { result.current.setViewTask(null); });
    expect(result.current.viewTask).toBeNull();
  });

  it("handleDeleteTask sets taskToDelete", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleDeleteTask("t1"); });
    expect(result.current.taskToDelete).toBe("t1");
  });

  it("confirmDeleteTask deletes the task and clears taskToDelete", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleDeleteTask("t1"); });
    global.fetch = mockFetch({});
    await act(async () => { await result.current.confirmDeleteTask(); });
    expect(result.current.tasks.find((t: any) => t.id === "t1")).toBeUndefined();
    expect(result.current.taskToDelete).toBeNull();
  });

  it("confirmDeleteTask does nothing when taskToDelete is null", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    global.fetch = mockFetch({});
    await act(async () => { await result.current.confirmDeleteTask(); });
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/tasks/"), expect.anything());
  });

  it("confirmDeleteTask alerts on delete failure", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleDeleteTask("t1"); });
    global.fetch = jest.fn().mockRejectedValue(new Error("Delete failed"));
    await act(async () => { await result.current.confirmDeleteTask(); });
    expect(window.alert).toHaveBeenCalledWith("Failed to delete task.");
  });

  it("cancelDelete clears taskToDelete", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.handleDeleteTask("t1"); });
    act(() => { result.current.cancelDelete(); });
    expect(result.current.taskToDelete).toBeNull();
  });

  it("setIsDialogOpen controls dialog visibility", async () => {
    const { result } = renderHook(() => useTasks("u1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.setIsDialogOpen(true); });
    expect(result.current.isDialogOpen).toBe(true);
    act(() => { result.current.setIsDialogOpen(false); });
    expect(result.current.isDialogOpen).toBe(false);
  });
});