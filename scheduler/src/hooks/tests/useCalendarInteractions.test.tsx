import { renderHook, act, waitFor } from "@testing-library/react";
import { useCalendarInteractions } from "@/hooks/useCalendarInteractions";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockRefreshEvents = jest.fn().mockResolvedValue([]);
const mockRefreshTasks = jest.fn().mockResolvedValue(undefined);

const mockEvent = {
  id: "aabbccddeeff001122334455",
  title: "Team Meeting",
  description: "Weekly sync",
  start: new Date("2024-06-10T10:00:00Z"),
  end: new Date("2024-06-10T11:00:00Z"),
  allDay: false,
  category: "work",
  recurrence: { type: "weekly", days: ["Mon"], until: "2024-12-31" },
};

const mockTask = {
  _id: "112233445566778899aabbcc",
  title: "Write tests",
  description: "Cover the hooks",
  dueDate: "2024-06-15",
  priority: "High",
  duration: 90,
  subtasks: ["unit tests", "integration tests"],
  bufferDays: 1,
  examId: "none",
  isRecurring: false,
  recurrence: null,
  url: "https://example.com",
};

global.fetch = jest.fn();
global.confirm = jest.fn();
global.alert = jest.fn();

jest.useFakeTimers();

// ── Helper ─────────────────────────────────────────────────────────────────

function setup(events: any[] = []) {
  return renderHook(() =>
    useCalendarInteractions(events, mockRefreshEvents, mockRefreshTasks),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Undo ───────────────────────────────────────────────────────────────────

describe("undo", () => {
  it("shows undo banner after a successful event delete", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    (global.confirm as jest.Mock).mockReturnValue(true);

    const { result } = setup();

    await act(async () => {
      await result.current.deleteEvent(mockEvent, "series");
    });

    expect(result.current.showUndo).toBe(true);
  });

  it("handleUndo handles an event with no recurrence", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    (global.confirm as jest.Mock).mockReturnValue(true);
  
    const eventWithoutRecurrence = { ...mockEvent, recurrence: undefined };
    const { result } = setup();
  
    await act(async () => {
      await result.current.deleteEvent(eventWithoutRecurrence, "series");
    });
  
    await act(async () => {
      await result.current.handleUndo();
    });
  
    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[1][1].body,
    );
    expect(body.recurrenceType).toBe("none");
    expect(body.recurrenceDays).toBeUndefined();
    expect(body.recurrenceUntil).toBeUndefined();
  });

  it("hides undo banner after 8 seconds", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    (global.confirm as jest.Mock).mockReturnValue(true);

    const { result } = setup();

    await act(async () => {
      await result.current.deleteEvent(mockEvent, "series");
    });

    act(() => jest.advanceTimersByTime(8000));

    expect(result.current.showUndo).toBe(false);
  });

  it("dismissUndo hides the banner immediately", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    (global.confirm as jest.Mock).mockReturnValue(true);

    const { result } = setup();

    await act(async () => {
      await result.current.deleteEvent(mockEvent, "series");
    });

    act(() => result.current.dismissUndo());

    expect(result.current.showUndo).toBe(false);
  });

  it("handleUndo re-creates the deleted event and hides the banner", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    (global.confirm as jest.Mock).mockReturnValue(true);

    const { result } = setup();

    await act(async () => {
      await result.current.deleteEvent(mockEvent, "series");
    });

    await act(async () => {
      await result.current.handleUndo();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/calendar/events",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.showUndo).toBe(false);
    expect(mockRefreshEvents).toHaveBeenCalled();
  });

  it("handleUndo does nothing when there is no deleted event", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.handleUndo();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ── Search ─────────────────────────────────────────────────────────────────

describe("search", () => {
  it("fetches results and shows them for a non-empty query", async () => {
    const apiResults = [
      {
        ...mockEvent,
        start: mockEvent.start.toISOString(),
        end: mockEvent.end.toISOString(),
      },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => apiResults,
    });

    const { result } = setup();

    await act(async () => {
      await result.current.handleSearch("Meeting");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/calendar/events?q=Meeting",
    );
    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].start).toBeInstanceOf(Date);
    expect(result.current.showSearchResults).toBe(true);
  });

  it("clears results immediately for an empty query", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.handleSearch("");
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.searchResults).toHaveLength(0);
    expect(result.current.showSearchResults).toBe(false);
  });

  it("clearSearch resets all search state", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => [] });

    const { result } = setup();

    await act(async () => {
      await result.current.handleSearch("standup");
    });

    act(() => result.current.clearSearch());

    expect(result.current.searchQuery).toBe("");
    expect(result.current.searchResults).toHaveLength(0);
    expect(result.current.showSearchResults).toBe(false);
  });

  it("showSearchResultsFor shows results only when a query is present", async () => {
    const { result } = setup();

    // No query yet — should stay hidden
    act(() => result.current.showSearchResultsFor());
    expect(result.current.showSearchResults).toBe(false);

    // After typing a query it should show
    (global.fetch as jest.Mock).mockResolvedValue({ json: async () => [] });
    await act(async () => {
      await result.current.handleSearch("standup");
    });

    act(() => {
      result.current.clearSearch(); // hide first
    });
    // Simulate re-focus — but query already cleared so it stays hidden
    act(() => result.current.showSearchResultsFor());
    expect(result.current.showSearchResults).toBe(false);
  });
});

// ── Event delete ───────────────────────────────────────────────────────────

describe("deleteEvent", () => {
  it("calls the API and refreshes events on success (series)", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    (global.confirm as jest.Mock).mockReturnValue(true);

    const { result } = setup();

    let success: boolean;
    await act(async () => {
      success = await result.current.deleteEvent(mockEvent, "series");
    });

    expect(success!).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("mode=series"),
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(mockRefreshEvents).toHaveBeenCalled();
  });

  it("passes instance date param when deleting a single occurrence", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    (global.confirm as jest.Mock).mockReturnValue(true);

    const { result } = setup();

    await act(async () => {
      await result.current.deleteEvent(mockEvent, "single");
    });

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain("mode=single");
    expect(calledUrl).toContain("date=");
  });

  it("returns false and shows an alert when the event id is invalid", async () => {
    const { result } = setup();

    let success: boolean;
    await act(async () => {
      success = await result.current.deleteEvent({ ...mockEvent, id: "bad-id" }, "series");
    });

    expect(success!).toBe(false);
    expect(global.alert).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns false without fetching when the user cancels", async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);

    const { result } = setup();

    let success: boolean;
    await act(async () => {
      success = await result.current.deleteEvent(mockEvent, "series");
    });

    expect(success!).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("alerts and returns false on API error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Server error" }),
    });
    (global.confirm as jest.Mock).mockReturnValue(true);

    const { result } = setup();

    let success: boolean;
    await act(async () => {
      success = await result.current.deleteEvent(mockEvent, "series");
    });

    expect(success!).toBe(false);
    expect(global.alert).toHaveBeenCalledWith("Server error");
  });
});

// ── Task delete ────────────────────────────────────────────────────────────

describe("deleteTask", () => {
  it("calls the API and refreshes tasks on confirmation", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    (global.confirm as jest.Mock).mockReturnValue(true);

    const { result } = setup();

    let success: boolean;
    await act(async () => {
      success = await result.current.deleteTask(mockTask._id);
    });

    expect(success!).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/tasks/${mockTask._id}`,
      { method: "DELETE" },
    );
    expect(mockRefreshTasks).toHaveBeenCalled();
  });

  it("returns false and skips fetch when the user cancels", async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);

    const { result } = setup();

    let success: boolean;
    await act(async () => {
      success = await result.current.deleteTask(mockTask._id);
    });

    expect(success!).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ── Task edit form ─────────────────────────────────────────────────────────

describe("task edit form", () => {
  it("openTaskEdit populates form data and opens the modal", () => {
    const { result } = setup();

    act(() => result.current.openTaskEdit(mockTask));

    expect(result.current.isTaskEditOpen).toBe(true);
    expect(result.current.taskFormData.name).toBe(mockTask.title);
  });

  it("submitTaskEdit sends null when url is empty", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
  
    const { result } = setup();
  
    await act(async () => {
      await result.current.submitTaskEdit(mockTask._id, {
        ...result.current.taskFormData,
        url: "",
      });
    });
  
    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(body.url).toBeNull();
  });

  it("setIsTaskEditOpen can close the modal", () => {
    const { result } = setup();

    act(() => result.current.openTaskEdit(mockTask));
    act(() => result.current.setIsTaskEditOpen(false));

    expect(result.current.isTaskEditOpen).toBe(false);
  });

  it("submitTaskEdit PATCHes the task, closes modal, and refreshes tasks", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    const { result } = setup();

    act(() => result.current.openTaskEdit(mockTask));

    await act(async () => {
      await result.current.submitTaskEdit(mockTask._id, {
        ...result.current.taskFormData,
        name: "Updated task name",
        durationHours: "1",
        durationMinutes: "30",
        subtasks: "write tests, run tests",
      });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/tasks/${mockTask._id}`,
      expect.objectContaining({ method: "PATCH" }),
    );

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(body.title).toBe("Updated task name");
    expect(body.duration).toBe(90); // 1h 30m
    expect(body.subtasks).toEqual(["write tests", "run tests"]);

    expect(result.current.isTaskEditOpen).toBe(false);
    expect(mockRefreshTasks).toHaveBeenCalled();
  });

  it("submitTaskEdit handles subtasks already provided as an array", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    const { result } = setup();

    await act(async () => {
      await result.current.submitTaskEdit(mockTask._id, {
        ...result.current.taskFormData,
        subtasks: ["a", "b"] as any,
      });
    });

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(body.subtasks).toEqual(["a", "b"]);
  });
});