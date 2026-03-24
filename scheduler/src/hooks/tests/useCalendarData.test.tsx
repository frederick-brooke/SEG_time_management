import { renderHook, act, waitFor } from "@testing-library/react";

// Mocks 

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("date-fns", () => ({
  addMinutes: (d: Date, m: number) => new Date(d.getTime() + m * 60000),
  subMinutes: (d: Date, m: number) => new Date(d.getTime() - m * 60000),
  addDays: (d: Date, n: number) => new Date(d.getTime() + n * 86400000),
  addWeeks: (d: Date, n: number) => new Date(d.getTime() + n * 7 * 86400000),
  addMonths: (d: Date, n: number) => {
    const r = new Date(d);
    r.setMonth(r.getMonth() + n);
    return r;
  },
}));

jest.mock("@/lib/taskSchedulingUtils", () => ({
  shouldShowAsUnscheduled: jest.fn(() => true),
}));

import { useCalendarData, expandRecurringTasks } from "../../hooks/useCalendarData";

// Helpers

const okJson = (data: any) =>
  Promise.resolve({ ok: true, json: async () => data });

const failRes = () =>
  Promise.resolve({ ok: false, json: async () => ({}) });

const makeEvent = (id: string, overrides: any = {}) => ({
  id,
  title: `Event ${id}`,
  category: "Work",
  start: "2025-01-01T10:00:00Z",
  end: "2025-01-01T11:00:00Z",
  travelDuration: 0,
  ...overrides,
});

const makeTask = (id: string, overrides: any = {}) => ({
  id,
  title: `Task ${id}`,
  completed: false,
  scheduledDate: "2025-01-01",
  scheduledTime: "2025-01-01T10:00:00Z",
  duration: 60,
  isRecurring: false,
  ...overrides,
});

// expandRecurringTasks 

describe("expandRecurringTasks", () => {
  it("returns non-recurring tasks as-is", () => {
    const task = makeTask("1");
    const result = expandRecurringTasks([task]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "1" });
  });

  it("returns task as-is when recurrence type is none", () => {
    const task = makeTask("1", { isRecurring: true, recurrence: { type: "none" } });
    const result = expandRecurringTasks([task]);
    expect(result).toHaveLength(1);
  });

  it("expands daily recurring tasks", () => {
    const until = new Date();
    until.setDate(until.getDate() + 3);
    const task = makeTask("1", {
      isRecurring: true,
      recurrence: { type: "daily", until: until.toISOString(), days: [] },
      scheduledTime: new Date().toISOString(),
    });
    const result = expandRecurringTasks([task]);
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it("expands monthly recurring tasks", () => {
    const until = new Date();
    until.setMonth(until.getMonth() + 2);
    const task = makeTask("1", {
      isRecurring: true,
      recurrence: { type: "monthly", until: until.toISOString(), days: [] },
      scheduledTime: new Date().toISOString(),
    });
    const result = expandRecurringTasks([task]);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("expands weekly recurring tasks for specified days", () => {
    const until = new Date();
    until.setDate(until.getDate() + 14);
    const task = makeTask("1", {
      isRecurring: true,
      recurrence: { type: "weekly", until: until.toISOString(), days: ["Mon", "Wed"] },
      scheduledTime: new Date().toISOString(),
    });
    const result = expandRecurringTasks([task]);
    expect(result.length).toBeGreaterThan(0);
  });

  it("adds occurrenceId to each expanded occurrence", () => {
    const until = new Date();
    until.setDate(until.getDate() + 2);
    const task = makeTask("1", {
      isRecurring: true,
      recurrence: { type: "daily", until: until.toISOString(), days: [] },
      scheduledTime: new Date().toISOString(),
    });
    const result = expandRecurringTasks([task]);
    result.forEach((r) => expect(r.occurrenceId).toMatch(/^1-/));
  });

  it("sets _type to task on each occurrence", () => {
    const until = new Date();
    until.setDate(until.getDate() + 1);
    const task = makeTask("1", {
      isRecurring: true,
      recurrence: { type: "daily", until: until.toISOString(), days: [] },
      scheduledTime: new Date().toISOString(),
    });
    const result = expandRecurringTasks([task]);
    result.forEach((r) => expect(r._type).toBe("task"));
  });

  it("handles empty tasks array", () => {
    expect(expandRecurringTasks([])).toEqual([]);
  });

  it("ignores unknown day abbreviations in weekly recurrence", () => {
    const until = new Date();
    until.setDate(until.getDate() + 7);
    const task = makeTask("1", {
      isRecurring: true,
      recurrence: { type: "weekly", until: until.toISOString(), days: ["INVALID"] },
      scheduledTime: new Date().toISOString(),
    });
    expect(() => expandRecurringTasks([task])).not.toThrow();
  });
});

// useCalendarData 

describe("useCalendarData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue(okJson([]));
  });

  it("initialises with empty events array", () => {
    const { result } = renderHook(() => useCalendarData("user-1"));
    expect(result.current.events).toEqual([]);
  });

  it("initialises with empty tasks array", () => {
    const { result } = renderHook(() => useCalendarData("user-1"));
    expect(result.current.tasks).toEqual([]);
  });

  it("initialises with empty categories array", () => {
    const { result } = renderHook(() => useCalendarData("user-1"));
    expect(result.current.categories).toEqual([]);
  });

  // refreshEvents
  it("refreshEvents fetches from /api/calendar/events", async () => {
    mockFetch.mockResolvedValueOnce(okJson([]));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.refreshEvents(); });
    expect(mockFetch).toHaveBeenCalledWith("/api/calendar/events");
  });

  it("refreshEvents converts start/end strings to Date objects", async () => {
    mockFetch.mockResolvedValueOnce(okJson([makeEvent("a")]));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.refreshEvents(); });
    const ev = result.current.events.find((e) => e.id === "a");
    expect(ev?.start).toBeInstanceOf(Date);
    expect(ev?.end).toBeInstanceOf(Date);
  });

  it("refreshEvents sets _type to event", async () => {
    mockFetch.mockResolvedValueOnce(okJson([makeEvent("a")]));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.refreshEvents(); });
    const ev = result.current.events.find((e) => e.id === "a");
    expect(ev?._type).toBe("event");
  });

  it("refreshEvents adds travel blocks for events with travelDuration > 0", async () => {
    mockFetch.mockResolvedValueOnce(okJson([makeEvent("a", { travelDuration: 30 })]));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.refreshEvents(); });
    const travelBlock = result.current.events.find((e) => e._type === "_travel");
    expect(travelBlock).toBeDefined();
  });

  it("refreshEvents does not add travel blocks when travelDuration is 0", async () => {
    mockFetch.mockResolvedValueOnce(okJson([makeEvent("a", { travelDuration: 0 })]));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.refreshEvents(); });
    const travelBlock = result.current.events.find((e) => e._type === "_travel");
    expect(travelBlock).toBeUndefined();
  });

  it("refreshEvents returns empty array when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce(failRes());
    const { result } = renderHook(() => useCalendarData("user-1"));
    const res = await act(async () => result.current.refreshEvents());
    expect(res).toEqual([]);
  });

  it("refreshEvents returns empty array when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useCalendarData("user-1"));
    const res = await act(async () => result.current.refreshEvents());
    expect(res).toEqual([]);
  });

  // refreshTasks
  it("refreshTasks fetches from /api/tasks with userId", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ tasks: [] }));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.refreshTasks(); });
    expect(mockFetch).toHaveBeenCalledWith("/api/tasks?userId=user-1");
  });

  it("refreshTasks filters out completed tasks", async () => {
    const tasks = [
      makeTask("1", { completed: false }),
      makeTask("2", { completed: true }),
    ];
    mockFetch.mockResolvedValueOnce(okJson({ tasks }));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.refreshTasks(); });
    expect(result.current.allFetchedTasks).toHaveLength(1);
    expect(result.current.allFetchedTasks[0].id).toBe("1");
  });

  it("refreshTasks returns null when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce(failRes());
    const { result } = renderHook(() => useCalendarData("user-1"));
    const res = await act(async () => result.current.refreshTasks());
    expect(res).toBeNull();
  });

  it("refreshTasks returns null when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useCalendarData("user-1"));
    const res = await act(async () => result.current.refreshTasks());
    expect(res).toBeNull();
  });

  // fetchCategories
  it("fetchCategories fetches from /api/categories", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ categories: [] }));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.fetchCategories(); });
    expect(mockFetch).toHaveBeenCalledWith("/api/categories");
  });

  it("fetchCategories sets categories state", async () => {
    const cats = [{ id: "cat-1", name: "Work" }];
    mockFetch.mockResolvedValueOnce(okJson({ categories: cats }));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.fetchCategories(); });
    expect(result.current.categories).toEqual(cats);
  });

  it("fetchCategories initialises all category filters to true", async () => {
    const cats = [{ id: "cat-1" }, { id: "cat-2" }];
    mockFetch.mockResolvedValueOnce(okJson({ categories: cats }));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.fetchCategories(); });
    expect(result.current.categoryFilters).toEqual({ "cat-1": true, "cat-2": true });
  });

  // fetchScheduleLogs
  it("fetchScheduleLogs fetches from /api/schedule-log", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ logs: [] }));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.fetchScheduleLogs(); });
    expect(mockFetch).toHaveBeenCalledWith("/api/schedule-log");
  });

  it("fetchScheduleLogs sets scheduleLogs state", async () => {
    const logs = [{ id: "log-1" }];
    mockFetch.mockResolvedValueOnce(okJson({ logs }));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.fetchScheduleLogs(); });
    expect(result.current.scheduleLogs).toEqual(logs);
  });

  // fetchExams
  it("fetchExams fetches from /api/exams", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ exams: [] }));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.fetchExams(); });
    expect(mockFetch).toHaveBeenCalledWith("/api/exams");
  });

  it("fetchExams sets exams state", async () => {
    const exams = [{ id: "exam-1", title: "Math" }];
    mockFetch.mockResolvedValueOnce(okJson({ exams }));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await act(async () => { await result.current.fetchExams(); });
    expect(result.current.exams).toEqual(exams);
  });

  it("fetchExams does not throw when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useCalendarData("user-1"));
    await expect(
      act(async () => { await result.current.fetchExams(); })
    ).resolves.not.toThrow();
  });
});
