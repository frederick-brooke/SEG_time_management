// useTaskEdit.test.ts
import { renderHook, act } from "@testing-library/react";
import { useTaskEdit } from "../useTaskEdit";
import { patchTask } from "../taskEditApi";
import { taskToFormData } from "@/lib/ui";
import type { TaskFormData } from "@/components/tasks/TaskForm";

jest.mock("../taskEditApi");
jest.mock("@/lib/ui");

const mockPatchTask = patchTask as jest.Mock;
const mockTaskToFormData = taskToFormData as jest.Mock;

const MOCK_FORM: TaskFormData = {
  name: "Test Task", description: "desc", dueDate: "2024-06-15", url: "",
  subtasks: "", durationHours: "1", durationMinutes: "0", examId: "none",
  priority: "Medium", bufferDays: 0, isRecurring: false, recurrence: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPatchTask.mockResolvedValue({ ok: true });
  mockTaskToFormData.mockReturnValue(MOCK_FORM);
});

function setup() {
  const refreshTasks = jest.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useTaskEdit(refreshTasks));
  return { result, refreshTasks };
}

// ── initial state ──────

describe("initial state", () => {
  it("starts with edit dialog closed", () => {
    const { result } = setup();
    expect(result.current.isTaskEditOpen).toBe(false);
  });

  it("starts with default form data", () => {
    const { result } = setup();
    expect(result.current.taskFormData).toEqual({
      name: "", description: "", dueDate: null, url: "", subtasks: "",
      durationHours: "0", durationMinutes: "0", examId: "none",
      priority: "Medium", bufferDays: 0, isRecurring: false, recurrence: null,
    });
  });
});

// ── openTaskEdit ───────

describe("openTaskEdit", () => {
  it("calls taskToFormData with the provided task", () => {
    const { result } = setup();
    const task = { id: "task123", title: "My Task" };
    act(() => { result.current.openTaskEdit(task); });
    expect(mockTaskToFormData).toHaveBeenCalledWith(task);
  });

  it("sets taskFormData to the result of taskToFormData", () => {
    const { result } = setup();
    act(() => { result.current.openTaskEdit({ id: "task123" }); });
    expect(result.current.taskFormData).toEqual(MOCK_FORM);
  });

  it("opens the edit dialog", () => {
    const { result } = setup();
    act(() => { result.current.openTaskEdit({ id: "task123" }); });
    expect(result.current.isTaskEditOpen).toBe(true);
  });
});

// ── submitTaskEdit ─────

describe("submitTaskEdit", () => {
  it("calls patchTask with taskId and form data", async () => {
    const { result } = setup();
    await act(async () => { await result.current.submitTaskEdit("task123", MOCK_FORM); });
    expect(mockPatchTask).toHaveBeenCalledWith("task123", MOCK_FORM);
  });

  it("closes the edit dialog after submit", async () => {
    const { result } = setup();
    act(() => { result.current.openTaskEdit({ id: "task123" }); });
    await act(async () => { await result.current.submitTaskEdit("task123", MOCK_FORM); });
    expect(result.current.isTaskEditOpen).toBe(false);
  });

  it("calls refreshTasks after submit", async () => {
    const { result, refreshTasks } = setup();
    await act(async () => { await result.current.submitTaskEdit("task123", MOCK_FORM); });
    expect(refreshTasks).toHaveBeenCalled();
  });
});

// ── setIsTaskEditOpen / setTaskFormData ─────

describe("setters", () => {
  it("setIsTaskEditOpen updates dialog state directly", () => {
    const { result } = setup();
    act(() => { result.current.setIsTaskEditOpen(true); });
    expect(result.current.isTaskEditOpen).toBe(true);
  });

  it("setTaskFormData updates form data directly", () => {
    const { result } = setup();
    act(() => { result.current.setTaskFormData(MOCK_FORM); });
    expect(result.current.taskFormData).toEqual(MOCK_FORM);
  });
});