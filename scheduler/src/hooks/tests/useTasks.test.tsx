// src/hooks/tests/useTasks.test.tsx
import { render, act } from "@testing-library/react";
import { useTasks } from "../useTasks";

const mockedFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockedFetch;

describe("useTasks hook", () => {
  const userId = "123";
  const initialTasks = [
    { id: 1, title: "Task 1", status: "todo", priority: "High", duration: 60 },
    { id: 2, title: "Task 2", status: "in-progress", priority: "Low", duration: 30 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function TestComponent({ onResult }: any) {
    const hook = useTasks(userId);
    onResult(hook);
    return null;
  }

  test("fetchTasks loads tasks on mount", async () => {
    let hookResult: any;

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tasks: initialTasks }),
    } as Response);

    render(<TestComponent onResult={(r) => (hookResult = r)} />);

    // wait for useEffect
    await act(async () => {});

    expect(mockedFetch).toHaveBeenCalledWith(`/api/tasks?userId=${userId}`);
    expect(hookResult.tasks).toEqual(initialTasks);
    expect(hookResult.isLoading).toBe(false);
  });

  test("createTask adds a new task", async () => {
    let hookResult: any;

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tasks: initialTasks }),
    } as Response);

    render(<TestComponent onResult={(r) => (hookResult = r)} />);

    await act(async () => {});

    const newTask = { id: 3, title: "New Task", status: "todo", priority: "Medium", duration: 45 };

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task: newTask }),
    } as Response);

    await act(async () => {
      await hookResult.createTask(newTask);
    });

    expect(hookResult.tasks[0]).toEqual(newTask);
  });

  test("updateTask modifies a task", async () => {
    let hookResult: any;

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tasks: initialTasks }),
    } as Response);

    render(<TestComponent onResult={(r) => (hookResult = r)} />);

    await act(async () => {});

    const updatedTask = { title: "Updated Task" };
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task: { ...initialTasks[0], ...updatedTask } }),
    } as Response);

    await act(async () => {
      await hookResult.updateTask(1, updatedTask);
    });

    expect(hookResult.tasks[0].title).toBe("Updated Task");
  });

  test("deleteTask removes a task", async () => {
    let hookResult: any;

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tasks: initialTasks }),
    } as Response);

    render(<TestComponent onResult={(r) => (hookResult = r)} />);
    await act(async () => {});

    mockedFetch.mockResolvedValueOnce({ ok: true } as Response);

    await act(async () => {
      await hookResult.deleteTask(1);
    });

    expect(hookResult.tasks.find((t: any) => t.id === 1)).toBeUndefined();
  });

  test("toggleTaskStatus cycles status", async () => {
    let hookResult: any;

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tasks: initialTasks }),
    } as Response);

    render(<TestComponent onResult={(r) => (hookResult = r)} />);
    await act(async () => {});

    const task = initialTasks[0];
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task: { ...task, status: "in-progress" } }),
    } as Response);

    await act(async () => {
      await hookResult.toggleTaskStatus(task.id);
    });

    expect(hookResult.tasks[0].status).toBe("in-progress");
  });

  test("sortTasks sorts by priority", async () => {
    let hookResult: any;

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tasks: initialTasks }),
    } as Response);

    render(<TestComponent onResult={(r) => (hookResult = r)} />);
    await act(async () => {});

    act(() => {
      hookResult.sortTasks();
    });

    expect(hookResult.tasks[0].priority).toBe("High");
    expect(hookResult.tasks[1].priority).toBe("Low");
  });

  test("handleEditTask populates formData", async () => {
    let hookResult: any;

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tasks: initialTasks }),
    } as Response);

    render(<TestComponent onResult={(r) => (hookResult = r)} />);
    await act(async () => {});

    act(() => hookResult.handleEditTask(1));

    expect(hookResult.formData.name).toBe("Task 1");
    expect(hookResult.isDialogOpen).toBe(true);
  });

  test("confirmDeleteTask calls deleteTask", async () => {
    let hookResult: any;

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tasks: initialTasks }),
    } as Response);

    render(<TestComponent onResult={(r) => (hookResult = r)} />);
    await act(async () => {});

    act(() => hookResult.handleDeleteTask(1));

    mockedFetch.mockResolvedValueOnce({ ok: true } as Response);

    await act(async () => hookResult.confirmDeleteTask());

    expect(hookResult.tasks.find((t: any) => t.id === 1)).toBeUndefined();
  });

  test("fetchTasks handles fetch error gracefully", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    let hookResult: any;

    mockedFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<TestComponent onResult={(r) => (hookResult = r)} />);

    await act(async () => {});

    expect(errorSpy).toHaveBeenCalled();
    expect(hookResult.tasks).toEqual([]);
    expect(hookResult.isLoading).toBe(false);

    errorSpy.mockRestore();
  });
});