// useTaskDelete.test.ts
import { renderHook } from "@testing-library/react";
import { useTaskDelete } from "../useTaskDelete";

global.fetch = jest.fn();
global.confirm = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (fetch as jest.Mock).mockResolvedValue({ ok: true });
});

function setup() {
  const refreshTasks = jest.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useTaskDelete(refreshTasks));
  return { deleteTask: result.current, refreshTasks };
}

// confirm dialog

describe("confirm dialog", () => {
  it("returns false without fetching when user cancels", async () => {
    (confirm as jest.Mock).mockReturnValueOnce(false);
    const { deleteTask } = setup();
    const result = await deleteTask("task123");
    expect(result).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("prompts with the correct message", async () => {
    (confirm as jest.Mock).mockReturnValueOnce(false);
    const { deleteTask } = setup();
    await deleteTask("task123");
    expect(confirm).toHaveBeenCalledWith("Delete this task?");
  });
});

// success path

describe("success path", () => {
  it("calls fetch with DELETE and correct URL", async () => {
    (confirm as jest.Mock).mockReturnValueOnce(true);
    const { deleteTask } = setup();
    await deleteTask("task123");
    expect(fetch).toHaveBeenCalledWith("/api/tasks/task123", { method: "DELETE" });
  });

  it("calls refreshTasks after deletion", async () => {
    (confirm as jest.Mock).mockReturnValueOnce(true);
    const { deleteTask, refreshTasks } = setup();
    await deleteTask("task123");
    expect(refreshTasks).toHaveBeenCalled();
  });

  it("returns true on success", async () => {
    (confirm as jest.Mock).mockReturnValueOnce(true);
    const { deleteTask } = setup();
    const result = await deleteTask("task123");
    expect(result).toBe(true);
  });
});