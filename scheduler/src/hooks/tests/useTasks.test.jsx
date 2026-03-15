import { renderHook, act, waitFor } from "@testing-library/react";
import { useTasks } from "../useTasks";

global.fetch = jest.fn();

describe("useTasks", () => {
  const userId = "user-123";

  const mockTasks = [
    {
      id: "1",
      title: "Task 1",
      description: "Test",
      priority: "Low",
      status: "todo",
      duration: 60,
      subtasks: ["a"],
      examId: null,
    },
    {
      id: "2",
      title: "Task 2",
      description: "Test",
      priority: "High",
      status: "in-progress",
      duration: 120,
      subtasks: [],
      examId: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches tasks on mount", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: mockTasks }),
    });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(`/api/tasks?userId=${userId}`);
    expect(result.current.tasks).toEqual(mockTasks);
  });

  test("handles fetch failure gracefully", async () => {
    fetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tasks).toEqual([]);
  });

  test("creates a task successfully", async () => {
    const newTask = { id: "3", title: "New Task" };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: newTask }),
      });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask({ title: "New Task" });
    });

    expect(result.current.tasks).toContainEqual(newTask);
  });

  test("throws error if createTask fails", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Bad request" }),
      });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      result.current.createTask({ title: "Bad" }),
    ).rejects.toThrow("Bad request");
  });

  test("updates a task", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: mockTasks }),
    });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.tasks.length).toBe(2));

    fetch.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await result.current.updateTask("1", { title: "Updated" });
    });

    expect(result.current.tasks[0].title).toBe("Updated");
  });

  test("deletes a task", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: mockTasks }),
    });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.tasks.length).toBe(2));

    fetch.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await result.current.deleteTask("1");
    });

    expect(result.current.tasks.length).toBe(1);
  });

  test("toggles task status", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: mockTasks }),
    });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.tasks.length).toBe(2));

    fetch.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await result.current.toggleTaskStatus("1");
    });

    expect(result.current.tasks[0].status).toBe("in-progress");
  });

  test("sorts tasks by priority", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: mockTasks }),
    });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.tasks.length).toBe(2));

    act(() => {
      result.current.sortTasks();
    });

    expect(result.current.tasks[0].priority).toBe("High");
  });

  test("handleFormChange updates formData", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [] }),
    });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.handleFormChange({ name: "Updated Task" });
    });

    expect(result.current.formData.name).toBe("Updated Task");
  });

  test("resetForm resets form state", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [] }),
    });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.handleFormChange({ name: "Test" });
      result.current.resetForm();
    });

    expect(result.current.formData.name).toBe("");
  });

  test("handleEditTask populates form", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: mockTasks }),
    });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.tasks.length).toBe(2));

    act(() => {
      result.current.handleEditTask("1");
    });

    expect(result.current.editingTaskId).toBe("1");
    expect(result.current.formData.name).toBe("Task 1");
  });

  test("handleDeleteTask sets delete target", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: mockTasks }),
    });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.tasks.length).toBe(2));

    act(() => {
      result.current.handleDeleteTask("1");
    });

    expect(result.current.taskToDelete).toBe("1");
  });

  test("confirmDeleteTask deletes selected task", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: mockTasks }),
    });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.tasks.length).toBe(2));

    act(() => {
      result.current.handleDeleteTask("1");
    });

    fetch.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await result.current.confirmDeleteTask();
    });

    expect(result.current.tasks.length).toBe(1);
  });

  test("cancelDelete clears delete state", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: mockTasks }),
    });

    const { result } = renderHook(() => useTasks(userId));

    await waitFor(() => expect(result.current.tasks.length).toBe(2));

    act(() => {
      result.current.handleDeleteTask("1");
      result.current.cancelDelete();
    });

    expect(result.current.taskToDelete).toBe(null);
  });
});