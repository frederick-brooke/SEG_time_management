import { renderHook } from "@testing-library/react";
import { useTaskFilters } from "../useTaskFilters";

/**
 * Tests the useTaskFilters hook to ensure proper task filtering, 
 * status categorization, overdue calculations, and progress tracking.
 */
describe("useTaskFilters", () => {
  const mockDate = new Date("2026-03-29T10:00:00Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const mockTasks = [
    { id: 1, title: "Completed Task", status: "completed", examId: "exam-1", dueDate: "2026-03-20" },
    { id: 2, title: "Future Todo", status: "todo", examId: "exam-1", dueDate: "2026-04-01" },
    { id: 3, title: "Active Progress", status: "in-progress", examId: "exam-2", dueDate: "2026-04-05" },
    { id: 4, title: "Overdue Task", status: "todo", examId: "exam-1", dueDate: "2026-03-28" },
    { id: 5, status: "todo" }, 
  ];

  it("returns default empty states when no tasks are provided", () => {
    const { result } = renderHook(() => useTaskFilters([], null, ""));

    expect(result.current.examFilteredTasks).toEqual([]);
    expect(result.current.todoTasks).toEqual([]);
    expect(result.current.inProgressTasks).toEqual([]);
    expect(result.current.completedTasks).toEqual([]);
    expect(result.current.overdueTasks).toEqual([]);
    expect(result.current.progressPercentage).toBe(0);
  });

  it("filters tasks by examId correctly", () => {
    const { result } = renderHook(() => useTaskFilters(mockTasks, "exam-1", ""));

    expect(result.current.examFilteredTasks).toHaveLength(3);
    expect(result.current.progressPercentage).toBe(33); 
  });

  it("filters tasks by search query and handles missing titles", () => {
    const { result } = renderHook(() => useTaskFilters(mockTasks, null, "active"));

    expect(result.current.inProgressTasks).toHaveLength(1);
    expect(result.current.inProgressTasks[0].id).toBe(3);
  });

  it("categorizes tasks into correct status arrays including overdue", () => {
    const { result } = renderHook(() => useTaskFilters(mockTasks, null, ""));

    expect(result.current.completedTasks).toHaveLength(1);
    expect(result.current.completedTasks[0].id).toBe(1);

    expect(result.current.todoTasks).toHaveLength(2);
    expect(result.current.todoTasks.map(t => t.id)).toEqual(expect.arrayContaining([2, 5]));

    expect(result.current.inProgressTasks).toHaveLength(1);
    expect(result.current.inProgressTasks[0].id).toBe(3);

    expect(result.current.overdueTasks).toHaveLength(1);
    expect(result.current.overdueTasks[0].id).toBe(4);
  });

  it("calculates progress percentage accurately across all tasks", () => {
    const { result } = renderHook(() => useTaskFilters(mockTasks, null, ""));
    expect(result.current.progressPercentage).toBe(20);
  });
});