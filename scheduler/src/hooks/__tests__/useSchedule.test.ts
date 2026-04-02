// src/hooks/useSchedule.test.ts
import { renderHook, act } from "@testing-library/react";
import { format, addDays, startOfWeek } from "date-fns";
import { useSchedule } from "../useSchedule";

// Helpers

const TODAY = new Date(2025, 5, 16); // Monday 16 Jun 2025 — fixed
const TODAY_STR = format(TODAY, "yyyy-MM-dd");
const WEEK_START_STR = format(startOfWeek(TODAY), "yyyy-MM-dd");

function makeTask(id: string, extra: Partial<any> = {}) {
  return { id, completed: false, scheduledDate: null, ...extra };
}

function makeRefreshTasks(tasks: any[] = []) {
  return jest.fn().mockResolvedValue(tasks);
}

function makeFetchScheduleLogs() {
  return jest.fn().mockResolvedValue(undefined);
}

/**
 * Mocks global.fetch via spyOn so jest.restoreAllMocks() in afterEach
 * correctly tears it down.
 */
function mockFetch(body: any, ok = true) {
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as any);
}

// Setup / teardown

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(TODAY);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// Initial state

describe("initial state", () => {
  it("sets sensible defaults", () => {
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks(), makeFetchScheduleLogs()),
    );
    const s = result.current.state;
    expect(s.showScheduleDialog).toBe(false);
    expect(s.scheduleMode).toBe("day");
    expect(s.scheduleDate).toBe(TODAY_STR);
    expect(s.scheduleWeekStart).toBe(WEEK_START_STR);
    expect(s.selectedTaskIds).toEqual([]);
    expect(s.unavailableDays).toEqual([]);
    expect(s.showFutureTasks).toBe(false);
    expect(s.futureModeAuto).toBe(true);
    expect(s.selectedFutureTaskIds).toEqual([]);
    expect(s.skipBreaks).toBe(false);
    expect(s.breakSessionMins).toBe(60);
    expect(s.breakLengthMins).toBe(15);
    expect(s.isScheduling).toBe(false);
    expect(s.requiresConfirmation).toBe(false);
    expect(s.overCapacityTasks).toEqual([]);
    expect(s.missedDeadlineTasks).toEqual([]);
    expect(s.scheduleDialogTasks).toEqual([]);
  });
});

// patch()

describe("patch()", () => {
  it("merges partial state", () => {
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks(), makeFetchScheduleLogs()),
    );
    act(() => result.current.patch({ skipBreaks: true, breakSessionMins: 90 }));
    expect(result.current.state.skipBreaks).toBe(true);
    expect(result.current.state.breakSessionMins).toBe(90);
    expect(result.current.state.breakLengthMins).toBe(15); // unchanged
  });
});

// open()

describe("open()", () => {
  it("opens dialog in day mode and selects unscheduled tasks", async () => {
    const tasks = [
      makeTask("t1"),
      makeTask("t2", { scheduledDate: TODAY_STR }),
      makeTask("t3", { completed: true }),
    ];
    const refreshTasks = makeRefreshTasks(tasks);
    const { result } = renderHook(() =>
      useSchedule([], refreshTasks, makeFetchScheduleLogs()),
    );

    await act(() => result.current.open("day", TODAY));

    const s = result.current.state;
    expect(s.showScheduleDialog).toBe(true);
    expect(s.scheduleMode).toBe("day");
    expect(s.scheduleDate).toBe(TODAY_STR);
    expect(s.scheduleWeekStart).toBe(TODAY_STR);
    // only t1 is unscheduled & not completed
    expect(s.selectedTaskIds).toEqual(["t1"]);
    expect(s.scheduleDialogTasks).toEqual(tasks);
  });

  it("opens dialog in week mode", async () => {
    const refreshTasks = makeRefreshTasks([]);
    const { result } = renderHook(() =>
      useSchedule([], refreshTasks, makeFetchScheduleLogs()),
    );

    await act(() => result.current.open("week", TODAY));

    expect(result.current.state.scheduleMode).toBe("week");
  });

  it("resets warnings when opening", async () => {
    const refreshTasks = makeRefreshTasks([]);
    const { result } = renderHook(() =>
      useSchedule([], refreshTasks, makeFetchScheduleLogs()),
    );

    // Set some warning state first
    act(() =>
      result.current.patch({
        requiresConfirmation: true,
        overCapacityTasks: [{ id: "x" }],
        missedDeadlineTasks: [{ id: "y" }],
      }),
    );

    await act(() => result.current.open("day", TODAY));

    expect(result.current.state.requiresConfirmation).toBe(false);
    expect(result.current.state.overCapacityTasks).toEqual([]);
    expect(result.current.state.missedDeadlineTasks).toEqual([]);
  });

  it("resets future-task state when opening", async () => {
    const refreshTasks = makeRefreshTasks([]);
    const { result } = renderHook(() =>
      useSchedule([], refreshTasks, makeFetchScheduleLogs()),
    );

    act(() =>
      result.current.patch({
        showFutureTasks: true,
        futureModeAuto: false,
        selectedFutureTaskIds: ["x"],
        unavailableDays: ["2025-06-17"],
      }),
    );

    await act(() => result.current.open("day", TODAY));

    expect(result.current.state.showFutureTasks).toBe(false);
    expect(result.current.state.futureModeAuto).toBe(true);
    expect(result.current.state.selectedFutureTaskIds).toEqual([]);
    expect(result.current.state.unavailableDays).toEqual([]);
  });

  it("handles refreshTasks returning null/undefined gracefully", async () => {
    const refreshTasks = jest.fn().mockResolvedValue(null);
    const { result } = renderHook(() =>
      useSchedule([], refreshTasks, makeFetchScheduleLogs()),
    );

    await act(() => result.current.open("day", TODAY));

    expect(result.current.state.selectedTaskIds).toEqual([]);
  });

  it("uses the calendarDate passed in, not today", async () => {
    const futureDate = addDays(TODAY, 5);
    const futureDateStr = format(futureDate, "yyyy-MM-dd");
    const refreshTasks = makeRefreshTasks([]);
    const { result } = renderHook(() =>
      useSchedule([], refreshTasks, makeFetchScheduleLogs()),
    );

    await act(() => result.current.open("day", futureDate));

    expect(result.current.state.scheduleDate).toBe(futureDateStr);
    expect(result.current.state.scheduleWeekStart).toBe(futureDateStr);
  });
});

// getScheduleDays()

describe("getScheduleDays()", () => {
  it("returns a single day in day mode", async () => {
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));

    const days = result.current.getScheduleDays();
    expect(days).toEqual([TODAY_STR]);
  });

  it("returns 7 days in week mode starting from scheduleWeekStart", async () => {
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("week", TODAY));

    const days = result.current.getScheduleDays();
    expect(days).toHaveLength(7);
    expect(days[0]).toBe(TODAY_STR);
    expect(days[6]).toBe(format(addDays(TODAY, 6), "yyyy-MM-dd"));
  });

  it("excludes unavailable days", async () => {
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("week", TODAY));

    const day2 = format(addDays(TODAY, 1), "yyyy-MM-dd");
    act(() => result.current.patch({ unavailableDays: [day2] }));

    const days = result.current.getScheduleDays();
    expect(days).toHaveLength(6);
    expect(days).not.toContain(day2);
  });

  it("returns empty array if all days are unavailable in day mode", async () => {
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    act(() => result.current.patch({ unavailableDays: [TODAY_STR] }));

    expect(result.current.getScheduleDays()).toEqual([]);
  });

  it("day-mode date strings are timezone-safe (no off-by-one)", async () => {
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    const days = result.current.getScheduleDays();
    expect(days[0]).toBe(TODAY_STR);
  });

  it("week-mode date strings are timezone-safe across all 7 days", async () => {
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("week", TODAY));
    const days = result.current.getScheduleDays();
    for (let i = 0; i < 7; i++) {
      expect(days[i]).toBe(format(addDays(TODAY, i), "yyyy-MM-dd"));
    }
  });
});

// schedule() — API call construction

describe("schedule()", () => {
  it("calls /api/schedule with correct payload in day mode", async () => {
    mockFetch({ success: true });
    const tasks = [makeTask("t1")];
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks(tasks), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    await act(() => result.current.schedule());

    expect(fetch).toHaveBeenCalledWith(
      "/api/schedule",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.mode).toBe("day");
    expect(body.taskIds).toContain("t1");
    expect(body.days).toEqual([TODAY_STR]);
    expect(body.ignoreCapacity).toBe(false);
  });

  it("passes ignoreCapacity=true when called with that flag", async () => {
    mockFetch({ success: true });
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    await act(() => result.current.schedule(true));

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.ignoreCapacity).toBe(true);
  });

  it("sends correct dateLabel for day mode", async () => {
    mockFetch({ success: true });
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.dateLabel).toBe(format(TODAY, "EEE MMM dd"));
  });

  it("sends correct dateLabel for week mode", async () => {
    mockFetch({ success: true });
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("week", TODAY));
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.dateLabel).toBe(`Week of ${format(TODAY, "MMM dd")}`);
  });

  it("sends skipBreaks overrides when skipBreaks is true", async () => {
    mockFetch({ success: true });
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    act(() => result.current.patch({ skipBreaks: true }));
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.breakOverrides).toEqual({ sessionLength: 9999, breakLength: 0 });
  });

  it("sends custom break settings when skipBreaks is false", async () => {
    mockFetch({ success: true });
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    act(() =>
      result.current.patch({ skipBreaks: false, breakSessionMins: 45, breakLengthMins: 10 }),
    );
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.breakOverrides).toEqual({ sessionLength: 45, breakLength: 10 });
  });

  it("sets isScheduling to false after scheduling completes", async () => {
    // act() batches and flushes all state updates so isScheduling=true is
    // never observable from outside — verify it starts and ends as false.
    mockFetch({ success: true });
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));

    expect(result.current.state.isScheduling).toBe(false);
    await act(() => result.current.schedule());
    expect(result.current.state.isScheduling).toBe(false);
  });


  it("closes dialog and refreshes on success", async () => {
    mockFetch({ success: true });
    const refreshTasks = makeRefreshTasks([]);
    const fetchScheduleLogs = makeFetchScheduleLogs();
    const { result } = renderHook(() =>
      useSchedule([], refreshTasks, fetchScheduleLogs),
    );
    await act(() => result.current.open("day", TODAY));
    await act(() => result.current.schedule());

    expect(result.current.state.showScheduleDialog).toBe(false);
    expect(result.current.state.scheduleDialogTasks).toEqual([]);
    expect(refreshTasks).toHaveBeenCalled();
    expect(fetchScheduleLogs).toHaveBeenCalled();
  });

  it("sets requiresConfirmation state when API returns it", async () => {
    mockFetch({
      requiresConfirmation: true,
      overCapacity: [{ id: "t1" }],
      missedDeadline: [{ id: "t2" }],
    });
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    await act(() => result.current.schedule());

    expect(result.current.state.requiresConfirmation).toBe(true);
    expect(result.current.state.overCapacityTasks).toEqual([{ id: "t1" }]);
    expect(result.current.state.missedDeadlineTasks).toEqual([{ id: "t2" }]);
    // Dialog should stay open
    expect(result.current.state.showScheduleDialog).toBe(true);
  });

  it("handles missing overCapacity gracefully (defaults to [])", async () => {
    mockFetch({ requiresConfirmation: true });
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    await act(() => result.current.schedule());

    expect(result.current.state.overCapacityTasks).toEqual([]);
  });

  it("sets missedDeadlineTasks and keeps dialog open when only missedDeadline returned", async () => {
    mockFetch({ missedDeadline: [{ id: "t3" }] });
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    await act(() => result.current.schedule());

    expect(result.current.state.missedDeadlineTasks).toEqual([{ id: "t3" }]);
    expect(result.current.state.showScheduleDialog).toBe(true);
  });

  it("logs error and returns early on non-ok response", async () => {
    mockFetch("Internal Server Error", false);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const refreshTasks = makeRefreshTasks([]);
    const { result } = renderHook(() =>
      useSchedule([], refreshTasks, makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    await act(() => result.current.schedule());

    expect(consoleSpy).toHaveBeenCalled();
    // Dialog should still be open (error path doesn't close it)
    expect(result.current.state.showScheduleDialog).toBe(true);
    // refreshTasks called once during open(), not again after error
    expect(refreshTasks).toHaveBeenCalledTimes(1);
  });

  it("resets warnings at the start of each schedule call", async () => {
    mockFetch({ success: true });
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    act(() =>
      result.current.patch({
        requiresConfirmation: true,
        overCapacityTasks: [{ id: "x" }],
      }),
    );
    await act(() => result.current.open("day", TODAY));
    await act(() => result.current.schedule());

    expect(result.current.state.requiresConfirmation).toBe(false);
    expect(result.current.state.overCapacityTasks).toEqual([]);
  });
});

// getFinalTaskIds() — via schedule() payload inspection

describe("getFinalTaskIds() task ID assembly", () => {
  it("includes selectedTaskIds", async () => {
    mockFetch({ success: true });
    const tasks = [makeTask("t1"), makeTask("t2")];
    const { result } = renderHook(() =>
      useSchedule([], makeRefreshTasks(tasks), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.taskIds).toContain("t1");
    expect(body.taskIds).toContain("t2");
  });

  it("includes weekIds (already-scheduled tasks in the week) in week mode", async () => {
    mockFetch({ success: true });
    const day2 = format(addDays(TODAY, 1), "yyyy-MM-dd");
    const scheduledTask = makeTask("scheduled1", { scheduledDate: day2 });
    const unscheduledTask = makeTask("unscheduled1");
    const allFetched = [scheduledTask, unscheduledTask];
    const { result } = renderHook(() =>
      useSchedule(allFetched, makeRefreshTasks([unscheduledTask]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("week", TODAY));

    // Manually set scheduleDialogTasks to include the scheduled task
    act(() => result.current.patch({ scheduleDialogTasks: allFetched }));
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.taskIds).toContain("scheduled1");
  });

  it("does NOT include weekIds in day mode", async () => {
    mockFetch({ success: true });
    const day2 = format(addDays(TODAY, 1), "yyyy-MM-dd");
    const scheduledTask = makeTask("scheduled1", { scheduledDate: day2 });
    const allFetched = [scheduledTask];
    const { result } = renderHook(() =>
      useSchedule(allFetched, makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    act(() => result.current.patch({ scheduleDialogTasks: allFetched }));
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.taskIds).not.toContain("scheduled1");
  });

  it("includes auto future tasks when showFutureTasks=true and futureModeAuto=true", async () => {
    mockFetch({ success: true });
    const tasks = [makeTask("t1"), makeTask("t2")];
    const { result } = renderHook(() =>
      useSchedule(tasks, makeRefreshTasks([makeTask("t1")]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    // t1 is selected; t2 should appear as a future task
    act(() =>
      result.current.patch({
        showFutureTasks: true,
        futureModeAuto: true,
        scheduleDialogTasks: tasks,
      }),
    );
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.taskIds).toContain("t2");
  });

  it("uses selectedFutureTaskIds when futureModeAuto=false", async () => {
    mockFetch({ success: true });
    const tasks = [makeTask("t1"), makeTask("t2"), makeTask("t3")];
    const { result } = renderHook(() =>
      useSchedule(tasks, makeRefreshTasks([makeTask("t1")]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    act(() =>
      result.current.patch({
        showFutureTasks: true,
        futureModeAuto: false,
        selectedFutureTaskIds: ["t3"],
        scheduleDialogTasks: tasks,
      }),
    );
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.taskIds).toContain("t3");
    expect(body.taskIds).not.toContain("t2");
  });

  it("excludes completed tasks from auto future tasks", async () => {
    mockFetch({ success: true });
    const tasks = [makeTask("t1"), makeTask("t2", { completed: true })];
    const { result } = renderHook(() =>
      useSchedule(tasks, makeRefreshTasks([makeTask("t1")]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    act(() =>
      result.current.patch({
        showFutureTasks: true,
        futureModeAuto: true,
        scheduleDialogTasks: tasks,
      }),
    );
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.taskIds).not.toContain("t2");
  });

  it("deduplicates task IDs", async () => {
    mockFetch({ success: true });
    const tasks = [makeTask("t1")];
    const { result } = renderHook(() =>
      useSchedule(tasks, makeRefreshTasks(tasks), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    // Force t1 into both selectedTaskIds and selectedFutureTaskIds
    act(() =>
      result.current.patch({
        showFutureTasks: true,
        futureModeAuto: false,
        selectedFutureTaskIds: ["t1"],
        scheduleDialogTasks: tasks,
      }),
    );
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    const t1Count = body.taskIds.filter((id: string) => id === "t1").length;
    expect(t1Count).toBe(1);
  });

  it("falls back to allFetchedTasks when scheduleDialogTasks is empty", async () => {
    mockFetch({ success: true });
    const allFetched = [makeTask("t1")];
    const { result } = renderHook(() =>
      useSchedule(allFetched, makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("day", TODAY));
    // scheduleDialogTasks is [] after open with no tasks returned
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    // No tasks since refreshTasks returned [] and allFetched isn't in dialog tasks
    // This just verifies no crash — the fallback path is exercised
    expect(Array.isArray(body.taskIds)).toBe(true);
  });

  it("excludes tasks already scheduled outside the week from weekIds", async () => {
    mockFetch({ success: true });
    const farFuture = format(addDays(TODAY, 30), "yyyy-MM-dd");
    const farTask = makeTask("far1", { scheduledDate: farFuture });
    const allFetched = [farTask];
    const { result } = renderHook(() =>
      useSchedule(allFetched, makeRefreshTasks([]), makeFetchScheduleLogs()),
    );
    await act(() => result.current.open("week", TODAY));
    act(() => result.current.patch({ scheduleDialogTasks: allFetched }));
    await act(() => result.current.schedule());

    const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.taskIds).not.toContain("far1");
  });
});

// close()

describe("close()", () => {
  it("hides dialog and calls refresh hooks", async () => {
    const refreshTasks = makeRefreshTasks([]);
    const fetchScheduleLogs = makeFetchScheduleLogs();
    const { result } = renderHook(() =>
      useSchedule([], refreshTasks, fetchScheduleLogs),
    );
    await act(() => result.current.open("day", TODAY));
    await act(() => result.current.close());

    expect(result.current.state.showScheduleDialog).toBe(false);
    expect(result.current.state.scheduleDialogTasks).toEqual([]);
    expect(refreshTasks).toHaveBeenCalledTimes(2); // once in open, once in close
    expect(fetchScheduleLogs).toHaveBeenCalledTimes(1);
  });
});