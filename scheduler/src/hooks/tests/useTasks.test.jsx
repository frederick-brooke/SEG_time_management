import { renderHook, act, waitFor } from "@testing-library/react";
import { useTasks } from "../useTasks";

global.fetch = jest.fn();
const fetchMock = global.fetch;

describe("useTasks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockFetchTasks(tasks = []) {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ tasks }),
    });
  }

  test("initial fetch loads tasks", async () => {
    mockFetchTasks([{ id: 1, title: "Task", priority: "Low", status: "todo" }]);

    const { result } = renderHook(() => useTasks("user1"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tasks.length).toBe(1);
  });

  test("createTask success", async () => {
    mockFetchTasks([]);

    const { result } = renderHook(() => useTasks("user1"));
    await waitFor(() => !result.current.isLoading);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task: { id: 2, title: "New Task" } }),
    });

    await act(async () => {
      await result.current.createTask({ title: "New Task" });
    });

    expect(result.current.tasks[0].title).toBe("New Task");
  });

  test("createTask API error", async () => {
    mockFetchTasks([]);

    const { result } = renderHook(() => useTasks("user1"));
    await waitFor(() => !result.current.isLoading);

    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Bad request" }),
    });

    await expect(
      result.current.createTask({ title: "Test" })
    ).rejects.toThrow("Bad request");
  });

  test("updateTask updates state", async () => {
    mockFetchTasks([{ id: 1, title: "Old", priority: "Low" }]);

    const { result } = renderHook(() => useTasks("user1"));
    await waitFor(() => !result.current.isLoading);

    fetchMock.mockResolvedValueOnce({});

    await act(async () => {
      await result.current.updateTask(1, { title: "Updated" });
    });

    expect(result.current.tasks[0].title).toBe("Updated");
  });

  test("deleteTask removes task", async () => {
    mockFetchTasks([{ id: 1 }]);

    const { result } = renderHook(() => useTasks("user1"));
    await waitFor(() => !result.current.isLoading);

    fetchMock.mockResolvedValueOnce({});

    await act(async () => {
      await result.current.deleteTask(1);
    });

    expect(result.current.tasks.length).toBe(0);
  });

  test("toggleTaskStatus cycles status", async () => {
    mockFetchTasks([{ id: 1, status: "todo", priority: "Low" }]);

    const { result } = renderHook(() => useTasks("user1"));
    await waitFor(() => !result.current.isLoading);

    fetchMock.mockResolvedValueOnce({});

    await act(async () => {
      await result.current.toggleTaskStatus(1);
    });

    expect(result.current.tasks[0].status).toBe("in-progress");
  });

  test("sortTasks sorts by priority", async () => {
    mockFetchTasks([
      { id: 1, priority: "Low" },
      { id: 2, priority: "High" },
    ]);

    const { result } = renderHook(() => useTasks("user1"));
    await waitFor(() => !result.current.isLoading);

    act(() => result.current.sortTasks());

    expect(result.current.tasks[0].priority).toBe("High");
  });

  test("handleFormChange updates form", async () => {
    mockFetchTasks([]);

    const { result } = renderHook(() => useTasks("user1"));
    await waitFor(() => !result.current.isLoading);

    act(() => {
      result.current.handleFormChange({ name: "Test Task" });
    });

    expect(result.current.formData.name).toBe("Test Task");
  });

  test("resetForm clears editing state", async () => {
    mockFetchTasks([]);

    const { result } = renderHook(() => useTasks("user1"));
    await waitFor(() => !result.current.isLoading);

    act(() => result.current.resetForm());

    expect(result.current.editingTaskId).toBe(null);
  });

  test("handleEditTask populates form", async () => {
    mockFetchTasks([
      {
        id: 1,
        title: "Task",
        description: "Desc",
        priority: "Low",
        duration: 90,
        subtasks: ["a", "b"],
      },
    ]);

    const { result } = renderHook(() => useTasks("user1"));
    await waitFor(() => !result.current.isLoading);

    act(() => result.current.handleEditTask(1));

    expect(result.current.formData.name).toBe("Task");
    expect(result.current.isDialogOpen).toBe(true);
  });

  test("delete confirmation flow", async () => {
    mockFetchTasks([{ id: 1 }]);

    const { result } = renderHook(() => useTasks("user1"));
    await waitFor(() => !result.current.isLoading);

    act(() => result.current.handleDeleteTask(1));
    expect(result.current.taskToDelete).toBe(1);

    fetchMock.mockResolvedValueOnce({});

    await act(async () => {
      await result.current.confirmDeleteTask();
    });

    expect(result.current.tasks.length).toBe(0);
  });

  test("cancelDelete resets delete state", async () => {
    mockFetchTasks([]);

    const { result } = renderHook(() => useTasks("user1"));
    await waitFor(() => !result.current.isLoading);

    act(() => result.current.handleDeleteTask(1));
    act(() => result.current.cancelDelete());

    expect(result.current.taskToDelete).toBe(null);
  });
});