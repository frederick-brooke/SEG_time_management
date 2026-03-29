import { renderHook, act } from "@testing-library/react";
import { useCalendarData } from "@/hooks/useCalendarData";

// ── Mocks ───────

global.fetch = jest.fn();

const mockEvent = {
  id: "aabbccddeeff001122334455",
  title: "Team Meeting",
  start: "2024-06-10T10:00:00Z",
  end: "2024-06-10T11:00:00Z",
  category: "work",
  allDay: false,
};

const mockEventWithTravel = {
  ...mockEvent,
  id: "aabbccddeeff001122334456",
  travelDuration: 30,
  title: "Off-site Meeting",
  transportMode: "driving",
};

const mockTask = {
  _id: "112233445566778899aabbcc",
  title: "Write tests",
  dueDate: "2024-06-15",
  priority: "High",
  duration: 90,
  scheduledDate: "2024-06-10",
  scheduledTime: "2024-06-10T14:00:00Z",
  completed: false,
  isRecurring: false,
  recurrence: { type: "none" },
};

const mockRecurringTask = {
  ...mockTask,
  _id: "aabb112233445566778899cc",
  title: "Daily Standup",
  scheduledDate: "2024-06-10",
  scheduledTime: "2024-06-10T09:00:00Z",
  isRecurring: true,
  recurrence: {
    type: "weekly",
    days: ["Mon", "Wed", "Fri"],
    until: "2024-06-30",
  },
  duration: 30,
};

const mockCategory = { id: "cat-work", name: "Work", color: "#ff0000" };

const USER_ID = "user-123";

beforeEach(() => {
  jest.clearAllMocks();
});

// ── refreshEvents ───────

describe("refreshEvents", () => {
  it("fetches events, converts start/end to Date objects, and sets state", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockEvent],
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshEvents();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/calendar/events");
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].start).toBeInstanceOf(Date);
    expect(result.current.events[0].end).toBeInstanceOf(Date);
    expect(result.current.events[0]._type).toBe("event");
  });

  it("returns an empty array and does not throw when the API fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    let returned: any[];
    await act(async () => {
      returned = await result.current.refreshEvents();
    });

    expect(returned!).toEqual([]);
    expect(result.current.events).toHaveLength(0);
  });

  it("returns empty array and does not throw on network error", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCalendarData(USER_ID));

    let returned: any[];
    await act(async () => {
      returned = await result.current.refreshEvents();
    });

    expect(returned!).toEqual([]);
  });

  it("appends travel blocks for events with travelDuration", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockEventWithTravel],
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshEvents();
    });

    // Original event + 1 travel block
    expect(result.current.events).toHaveLength(2);
    const travel = result.current.events.find((e) => e._type === "_travel");
    expect(travel).toBeDefined();
    expect(travel!.title).toContain("30 min");
    expect(travel!.title).toContain("Off-site Meeting");
    expect(travel!._eventId).toBe(mockEventWithTravel.id);
  });

  it("does not create travel blocks for events with zero travelDuration", async () => {
    const noTravelEvent = {
      ...mockEventWithTravel,
      id: "aabbccddeeff001122334457",
      travelDuration: 0,
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [noTravelEvent],
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshEvents();
    });

    const travel = result.current.events.find((e) => e._type === "_travel");
    expect(travel).toBeUndefined();
  });

  it("does not create travel blocks for events with negative travelDuration", async () => {
    const negativeTravelEvent = {
      ...mockEventWithTravel,
      id: "aabbccddeeff001122334458",
      travelDuration: -10,
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [negativeTravelEvent],
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshEvents();
    });

    const travel = result.current.events.find((e) => e._type === "_travel");
    expect(travel).toBeUndefined();
  });

  it("travel block end time equals event start time", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockEventWithTravel],
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshEvents();
    });

    const originalEvent = result.current.events.find(
      (e) => e._type === "event",
    );
    const travel = result.current.events.find((e) => e._type === "_travel");
    expect(travel!.end.getTime()).toBe(originalEvent!.start.getTime());
  });

  it("travel block start is travelDuration minutes before event start", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockEventWithTravel],
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshEvents();
    });

    const originalEvent = result.current.events.find(
      (e) => e._type === "event",
    );
    const travel = result.current.events.find((e) => e._type === "_travel");
    const diffMins =
      (originalEvent!.start.getTime() - travel!.start.getTime()) / 60000;
    expect(diffMins).toBe(mockEventWithTravel.travelDuration);
  });

  it("returns the full list of events including travel blocks", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockEvent, mockEventWithTravel],
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    let returned: any[];
    await act(async () => {
      returned = await result.current.refreshEvents();
    });

    // 2 real events + 1 travel block for the event with travelDuration
    expect(returned!).toHaveLength(3);
  });
});

// ── refreshTasks 

describe("refreshTasks", () => {
  it("fetches tasks, splits scheduled vs unscheduled, and sets state", async () => {
    const unscheduledTask = {
      ...mockTask,
      _id: "cc2233445566778899aabbcc",
      scheduledDate: null,
      scheduledTime: null,
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [mockTask, unscheduledTask] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshTasks([]);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/tasks?userId=${USER_ID}`,
    );
    expect(result.current.tasks.length).toBeGreaterThan(0);
    expect(result.current.tasks[0].start).toBeInstanceOf(Date);
    expect(result.current.tasks[0]._type).toBe("task");
  });

  it("returns null and does not throw on network error", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCalendarData(USER_ID));

    let returned: any;
    await act(async () => {
      returned = await result.current.refreshTasks([]);
    });

    expect(returned).toBeNull();
  });

  it("excludes completed tasks from allFetchedTasks", async () => {
    const completedTask = { ...mockTask, _id: "cc0011223344556677889900", completed: true };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [mockTask, completedTask] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshTasks([]);
    });

    expect(result.current.allFetchedTasks.every((t: any) => !t.completed)).toBe(true);
  });

  it("task end time is scheduledTime + duration minutes", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [mockTask] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshTasks([]);
    });

    const task = result.current.tasks[0];
    const diffMins = (task.end.getTime() - task.start.getTime()) / 60000;
    expect(diffMins).toBe(mockTask.duration);
  });

  it("returns fresh non-completed tasks list", async () => {
    const completedTask = { ...mockTask, _id: "cc0011223344556677889900", completed: true };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [mockTask, completedTask] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    let returned: any;
    await act(async () => {
      returned = await result.current.refreshTasks([]);
    });

    expect(returned).toHaveLength(1);
    expect(returned[0]._id).toBe(mockTask._id);
  });
});

// ── expandRecurringTasks 

describe("recurring tasks via refreshTasks", () => {
  it("expands weekly recurring tasks into multiple occurrences", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [mockRecurringTask] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshTasks([]);
    });

    expect(result.current.tasks.length).toBeGreaterThan(1);
  });

  it("assigns unique occurrenceId to each expanded occurrence", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [mockRecurringTask] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshTasks([]);
    });

    const ids = result.current.tasks.map((t: any) => t.occurrenceId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("does not expand tasks with recurrence type 'none'", async () => {
    const nonRecurring = { ...mockRecurringTask, recurrence: { type: "none" }, isRecurring: true };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [nonRecurring] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshTasks([]);
    });

    expect(result.current.tasks).toHaveLength(1);
  });

  it("non-recurring scheduled tasks are not expanded", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [mockTask] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshTasks([]);
    });

    expect(result.current.tasks).toHaveLength(1);
  });
});



// ── travel title formatting branches ────────

describe("travel block title formatting", () => {
  it("formats travelDuration as 'Xh' when it is an exact number of hours", async () => {
    const exactHourEvent = {
      ...mockEventWithTravel,
      id: "aabbccddeeff001122334459",
      travelDuration: 60,
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [exactHourEvent],
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshEvents();
    });

    const travel = result.current.events.find((e: any) => e._type === "_travel");
    expect(travel!.title).toContain("1h");
    expect(travel!.title).not.toContain("min");
  });

  it("formats travelDuration as 'Xh Ym' when hours plus leftover minutes", async () => {
    const mixedEvent = {
      ...mockEventWithTravel,
      id: "aabbccddeeff00112233445a",
      travelDuration: 90,
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mixedEvent],
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshEvents();
    });

    const travel = result.current.events.find((e: any) => e._type === "_travel");
    expect(travel!.title).toContain("1h 30m");
  });
});

// ── expandRecurringTasks — daily, monthly and no-days branches ───

describe("daily and monthly recurring tasks via refreshTasks", () => {
  it("expands a daily recurring task into multiple occurrences", async () => {
    const dailyTask = {
      ...mockTask,
      _id: "bb0011223344556677889900",
      title: "Daily Review",
      isRecurring: true,
      recurrence: { type: "daily", until: "2024-06-14" },
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [dailyTask] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshTasks([]);
    });

    expect(result.current.tasks.length).toBeGreaterThan(1);
    result.current.tasks.forEach((t: any) => {
      expect(t.occurrenceId).toBeDefined();
    });
  });

  it("skips invalid weekday values in recurrence.days", async () => {
    const invalidDayTask = {
      ...mockRecurringTask,
      recurrence: {
        type: "weekly",
        days: ["Mon", "INVALID"], // invalid value
        until: "2024-06-30",
      },
    };
  
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [invalidDayTask] }),
    });
  
    const { result } = renderHook(() => useCalendarData(USER_ID));
  
    await act(async () => {
      await result.current.refreshTasks([]);
    });
  
    expect(result.current.tasks.length).toBeGreaterThan(0);
  });

  it("uses default 12-month limit when recurrence.until is missing", async () => {
    const noUntilTask = {
      ...mockRecurringTask,
      recurrence: {
        type: "daily",
      },
    };
  
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [noUntilTask] }),
    });
  
    const { result } = renderHook(() => useCalendarData(USER_ID));
  
    await act(async () => {
      await result.current.refreshTasks([]);
    });
  
    expect(result.current.tasks.length).toBeGreaterThan(1);
  });

  it("expands a monthly recurring task into multiple occurrences", async () => {
    const monthlyTask = {
      ...mockTask,
      _id: "cc0011223344556677889900",
      title: "Monthly Review",
      isRecurring: true,
      recurrence: { type: "monthly", until: "2024-09-10" },
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [monthlyTask] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshTasks([]);
    });

    expect(result.current.tasks.length).toBeGreaterThan(1);
  });

  it("produces no occurrences for a weekly task with an empty days array", async () => {
    const noDaysTask = {
      ...mockTask,
      _id: "dd0011223344556677889900",
      title: "Broken Weekly",
      isRecurring: true,
      recurrence: { type: "weekly", days: [], until: "2024-06-30" },
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [noDaysTask] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.refreshTasks([]);
    });

    expect(result.current.tasks).toHaveLength(0);
  });
});

// ── fetchCategories ─────

describe("fetchCategories", () => {
  it("fetches categories and initialises all filters to true", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ categories: [mockCategory] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.fetchCategories();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/categories");
    expect(result.current.categories).toHaveLength(1);
    expect(result.current.categoryFilters[mockCategory.id]).toBe(true);
  });

  it("handles an empty categories array gracefully", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ categories: [] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.fetchCategories();
    });

    expect(result.current.categories).toHaveLength(0);
    expect(result.current.categoryFilters).toEqual({});
  });

  it("sets a filter entry for every returned category", async () => {
    const cats = [
      { id: "cat-1", name: "Work" },
      { id: "cat-2", name: "Personal" },
      { id: "cat-3", name: "Study" },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ categories: cats }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.fetchCategories();
    });

    expect(Object.keys(result.current.categoryFilters)).toHaveLength(3);
    cats.forEach((c) => expect(result.current.categoryFilters[c.id]).toBe(true));
  });
});

// ── fetchScheduleLogs ───

describe("fetchScheduleLogs", () => {
  it("fetches and stores schedule logs", async () => {
    const mockLogs = [{ id: "log-1", action: "scheduled", taskId: mockTask._id }];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ logs: mockLogs }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.fetchScheduleLogs();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/schedule-log");
    expect(result.current.scheduleLogs).toHaveLength(1);
    expect(result.current.scheduleLogs[0].id).toBe("log-1");
  });

  it("stores an empty array when no logs are returned", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ logs: [] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.fetchScheduleLogs();
    });

    expect(result.current.scheduleLogs).toHaveLength(0);
  });
});

// ── fetchExams ──

describe("fetchExams", () => {
  it("fetches and stores exams", async () => {
    const mockExams = [{ id: "exam-1", title: "Maths Final", date: "2024-06-20" }];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ exams: mockExams }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.fetchExams();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/exams");
    expect(result.current.exams).toHaveLength(1);
  });

  it("does not throw when the exams API fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await expect(
      act(async () => {
        await result.current.fetchExams();
      }),
    ).resolves.not.toThrow();

    expect(result.current.exams).toHaveLength(0);
  });

  it("stores empty array when no exams are returned", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ exams: [] }),
    });

    const { result } = renderHook(() => useCalendarData(USER_ID));

    await act(async () => {
      await result.current.fetchExams();
    });

    expect(result.current.exams).toHaveLength(0);
  });
});

// ── state setters ───────

describe("state setters", () => {
  it("setEvents updates the events state", () => {
    const { result } = renderHook(() => useCalendarData(USER_ID));

    act(() => {
      result.current.setEvents([{ id: "evt-manual", _type: "event" }] as any);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe("evt-manual");
  });

  it("setTasks updates the tasks state", () => {
    const { result } = renderHook(() => useCalendarData(USER_ID));

    act(() => {
      result.current.setTasks([{ id: "task-manual", _type: "task" }] as any);
    });

    expect(result.current.tasks).toHaveLength(1);
  });

  it("setUnscheduledTasks updates unscheduled tasks", () => {
    const { result } = renderHook(() => useCalendarData(USER_ID));

    act(() => {
      result.current.setUnscheduledTasks([mockTask] as any);
    });

    expect(result.current.unscheduledTasks).toHaveLength(1);
  });

  it("setCategoryFilters overrides category filter map", () => {
    const { result } = renderHook(() => useCalendarData(USER_ID));

    act(() => {
      result.current.setCategoryFilters({ "cat-work": false });
    });

    expect(result.current.categoryFilters["cat-work"]).toBe(false);
  });
});

// ── computeUnscheduled ──

describe("computeUnscheduled", () => {
  it("returns tasks that shouldShowAsUnscheduled given events", () => {
    const { result } = renderHook(() => useCalendarData(USER_ID));

    // A task with no scheduledDate/scheduledTime should appear unscheduled
    const unscheduled = { ...mockTask, scheduledDate: null, scheduledTime: null };
    const output = result.current.computeUnscheduled([unscheduled], []);

    expect(output).toHaveLength(1);
    expect(output[0]._id).toBe(unscheduled._id);
  });

  it("is a stable reference across renders", () => {
    const { result, rerender } = renderHook(() => useCalendarData(USER_ID));

    const first = result.current.computeUnscheduled;
    rerender();
    expect(result.current.computeUnscheduled).toBe(first);
  });
});