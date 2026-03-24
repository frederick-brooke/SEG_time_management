import { renderHook, act, waitFor } from "@testing-library/react";
import { useEventForm } from "@/hooks/useEventForm";

// ── Mocks ──────────────────────────────────────────────────────────────────

global.fetch = jest.fn();
global.confirm = jest.fn();
global.alert = jest.fn();

const VALID_ID = "aabbccddeeff001122334455";

const mockExistingEvent = {
  id: "bbccddeeff001122334455aa",
  start: "2024-06-10T09:00:00.000Z",
  end: "2024-06-10T10:00:00.000Z",
};

const mockInitialEvent = {
  id: VALID_ID,
  title: "Team Meeting",
  description: "Weekly sync",
  category: "Lecture",
  start: "2024-06-10T10:00:00.000Z",
  end: "2024-06-10T11:00:00.000Z",
  recurrence: { type: "weekly", days: ["Mon"], until: "2024-12-31" },
  startCoords: { lat: 51.5, lng: -0.1 },
  destinationCoords: { lat: 51.51, lng: -0.09 },
  startLocationName: "Home",
  destLocationName: "Office",
  transportMode: "cycling",
  travelDuration: 20,
};

const mockCategories = { categories: ["Lecture", "Lab", "Social"] };

const mockOnSuccess = jest.fn();

function defaultFetchMock() {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/categories")
      return Promise.resolve({ json: async () => mockCategories });
    if (url.startsWith("/api/travel/preview"))
      return Promise.resolve({ json: async () => ({ duration: 15 }) });
    if (url.includes("/api/calendar/events"))
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: "newid123" }),
      });
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  defaultFetchMock();
});

// ── Helper ─────────────────────────────────────────────────────────────────

function setup(
  initialEvent: any = null,
  initialStartDate = "",
  userId = "user1",
  existingEvents: any[] = [],
) {
  return renderHook(() =>
    useEventForm(initialEvent, initialStartDate, userId, existingEvents),
  );
}

// ── Initial state ──────────────────────────────────────────────────────────

describe("initial state", () => {
  it("defaults to empty fields when no initialEvent is provided", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    expect(result.current.title).toBe("");
    expect(result.current.description).toBe("");
    expect(result.current.category).toBe("Lecture");
    expect(result.current.recurrenceType).toBe("none");
    expect(result.current.isGoogle).toBe(false);
    expect(result.current.isRecurringEv).toBe(false);
  });

  it("populates fields from initialEvent", async () => {
    const { result } = setup(mockInitialEvent);
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    expect(result.current.title).toBe("Team Meeting");
    expect(result.current.description).toBe("Weekly sync");
    expect(result.current.category).toBe("Lecture");
    expect(result.current.recurrenceType).toBe("weekly");
    expect(result.current.recurrenceDays).toEqual(["Mon"]);
    expect(result.current.isRecurringEv).toBe(true);
  });

  it("sets editMode to 'single' for a recurring event", async () => {
    const { result } = setup(mockInitialEvent);
    expect(result.current.editMode).toBe("single");
  });

  it("sets editMode to 'series' for a non-recurring event", async () => {
    const { result } = setup({ ...mockInitialEvent, recurrence: { type: "none" } });
    expect(result.current.editMode).toBe("series");
  });

  it("flags isGoogle for Google events", async () => {
    const { result } = setup({ ...mockInitialEvent, isGoogleEvent: true });
    expect(result.current.isGoogle).toBe(true);
  });

  it("uses initialStartDate when no initialEvent is provided", async () => {
    const { result } = setup(null, "2024-08-01");
    expect(result.current.startDate).toBe("2024-08-01");
    expect(result.current.endDate).toBe("2024-08-01");
  });

  it("sets travelTimeMode to 'manual' when travelDuration exists but no coords", async () => {
    const eventWithoutCoords = {
      ...mockInitialEvent,
      startCoords: undefined,
      destinationCoords: undefined,
      travelDuration: 30,
    };
    const { result } = setup(eventWithoutCoords);
    expect(result.current.travelTimeMode).toBe("manual");
    expect(result.current.manualTravelTime).toBe(30);
  });

  it("sets travelTimeMode to 'auto' when coords are present", async () => {
    const { result } = setup(mockInitialEvent);
    expect(result.current.travelTimeMode).toBe("auto");
    expect(result.current.manualTravelTime).toBeNull();
  });
});

// ── Categories effect ──────────────────────────────────────────────────────

describe("categories fetch", () => {
  it("fetches categories on mount", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.categories).toHaveLength(3));
    expect(global.fetch).toHaveBeenCalledWith("/api/categories");
  });

  it("falls back to empty array when response has no categories key", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/categories")
        return Promise.resolve({ json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    const { result } = setup();
    await waitFor(() => expect(result.current.categories).toEqual([]));
  });
});

// ── Recurrence day auto-select effect ─────────────────────────────────────

describe("recurrenceDays auto-select effect", () => {
  it("auto-selects the weekday matching startDate when switching to weekly", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    act(() => result.current.setStartDate("2024-06-10")); // Monday
    act(() => result.current.setRecurrenceType("weekly"));

    await waitFor(() =>
      expect(result.current.recurrenceDays).toContain("Mon"),
    );
  });

  it("does not overwrite days already set", async () => {
    const { result } = setup(mockInitialEvent); // already has ["Mon"]
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    // Trigger effect by changing type away then back
    act(() => result.current.setRecurrenceType("daily"));
    act(() => result.current.setRecurrenceType("weekly"));

    // Days were already populated so should not be replaced
    await waitFor(() =>
      expect(result.current.recurrenceDays).toEqual(["Mon"]),
    );
  });
});

// ── Travel preview effect ──────────────────────────────────────────────────

describe("travel preview effect", () => {
  it("fetches travel preview when coords and auto mode are set", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    act(() => {
      result.current.setStartCoords({ lat: 51.5, lng: -0.1 });
      result.current.setDestCoords({ lat: 51.51, lng: -0.09 });
    });

    await waitFor(() => expect(result.current.travelPreview).toBe(15));
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/travel/preview"),
    );
  });

  it("does not fetch when travelTimeMode is manual", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    act(() => result.current.setTravelTimeMode("manual"));
    act(() => {
      result.current.setStartCoords({ lat: 51.5, lng: -0.1 });
      result.current.setDestCoords({ lat: 51.51, lng: -0.09 });
    });

    // Only the categories fetch should have been called
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/travel/preview"),
    );
  });

  it("re-fetches when transport mode changes", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    act(() => {
      result.current.setStartCoords({ lat: 51.5, lng: -0.1 });
      result.current.setDestCoords({ lat: 51.51, lng: -0.09 });
    });
    await waitFor(() => expect(result.current.travelPreview).toBe(15));

    act(() => result.current.setTransportMode("driving"));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls.filter((c) =>
        c[0].includes("/api/travel/preview"),
      );
      expect(calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("sets isCalculating to false after fetch resolves", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    act(() => {
      result.current.setStartCoords({ lat: 51.5, lng: -0.1 });
      result.current.setDestCoords({ lat: 51.51, lng: -0.09 });
    });

    await waitFor(() => expect(result.current.isCalculating).toBe(false));
  });
});

// ── handleSubmit ───────────────────────────────────────────────────────────

describe("handleSubmit", () => {
  const makeEvent = (e: React.FormEvent) => {
    (e as any).preventDefault = jest.fn();
    return e;
  };

  it("does nothing for Google events", async () => {
    const { result } = setup({ ...mockInitialEvent, isGoogleEvent: true });
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: jest.fn() } as any,
        mockOnSuccess,
      );
    });

    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/calendar/events"),
      expect.anything(),
    );
  });

  it("alerts when end is before or equal to start", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    act(() => {
      result.current.setStartDate("2024-06-10");
      result.current.setStartTime("11:00");
      result.current.setEndDate("2024-06-10");
      result.current.setEndTime("10:00");
    });

    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: jest.fn() } as any,
        mockOnSuccess,
      );
    });

    expect(global.alert).toHaveBeenCalledWith("End time must be after start time");
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/calendar/events"),
      expect.anything(),
    );
  });

  it("shows conflict dialog on overlapping event (first submit)", async () => {
    const { result } = setup(null, "", "user1", [mockExistingEvent]);
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    // Set times that overlap with mockExistingEvent (09:00–10:00 UTC)
    act(() => {
      result.current.setStartDate("2024-06-10");
      result.current.setStartTime("09:30");
      result.current.setEndDate("2024-06-10");
      result.current.setEndTime("10:30");
    });

    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: jest.fn() } as any,
        mockOnSuccess,
      );
    });

    expect(result.current.showConflict).toBe(true);
    expect(result.current.pendingPayload).not.toBeNull();
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/calendar/events"),
      expect.anything(),
    );
  });

  it("proceeds with save if conflict already acknowledged", async () => {
    const { result } = setup(null, "", "user1", [mockExistingEvent]);
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    act(() => {
      result.current.setStartDate("2024-06-10");
      result.current.setStartTime("09:30");
      result.current.setEndDate("2024-06-10");
      result.current.setEndTime("10:30");
      result.current.setShowConflict(true); // simulate user acknowledging
    });

    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: jest.fn() } as any,
        mockOnSuccess,
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/calendar/events",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("POSTs a new event and shows task prompt", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    act(() => {
      result.current.setTitle("New Event");
      result.current.setStartDate("2024-06-10");
      result.current.setStartTime("10:00");
      result.current.setEndDate("2024-06-10");
      result.current.setEndTime("11:00");
    });

    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: jest.fn() } as any,
        mockOnSuccess,
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/calendar/events",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.showTaskPrompt).toBe(true);
    expect(result.current.createdEventId).toBe("newid123");
  });

  it("PATCHes an existing event and calls onSuccess", async () => {
    const { result } = setup(mockInitialEvent);
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: jest.fn() } as any,
        mockOnSuccess,
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/calendar/events",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("alerts on API error", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/categories")
        return Promise.resolve({ json: async () => mockCategories });
      return Promise.resolve({
        ok: false,
        json: async () => ({ message: "Conflict error" }),
      });
    });
  
    const { result } = setup(mockInitialEvent);
    await waitFor(() => expect(result.current.categories).toHaveLength(3));
  
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: jest.fn() } as any,
        mockOnSuccess,
      );
    });
  
    expect(global.alert).toHaveBeenCalledWith("Conflict error");
  });

  it("buildPayload omits recurrenceDays for non-weekly recurrence", async () => {
    const { result } = setup(mockInitialEvent);
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    act(() => result.current.setRecurrenceType("monthly"));

    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: jest.fn() } as any,
        mockOnSuccess,
      );
    });

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls.find((c) =>
        c[0] === "/api/calendar/events",
      )[1].body,
    );
    expect(body.recurrenceDays).toBeUndefined();
  });

  it("buildPayload omits coords when travelTimeMode is manual", async () => {
    const { result } = setup(mockInitialEvent);
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    act(() => result.current.setTravelTimeMode("manual"));

    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: jest.fn() } as any,
        mockOnSuccess,
      );
    });

    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls.find((c) =>
        c[0] === "/api/calendar/events",
      )[1].body,
    );
    expect(body.startCoords).toBeNull();
    expect(body.destCoords).toBeNull();
    expect(body.startLocationName).toBe("");
    expect(body.destLocationName).toBe("");
  });
});

// ── handleDelete ───────────────────────────────────────────────────────────

describe("handleDelete", () => {
  it("does nothing when there is no initialEvent id", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    await act(async () => {
      await result.current.handleDelete(mockOnSuccess);
    });

    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/calendar/events"),
      expect.anything(),
    );
  });

  it("does nothing for Google events", async () => {
    const { result } = setup({ ...mockInitialEvent, isGoogleEvent: true });
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    await act(async () => {
      await result.current.handleDelete(mockOnSuccess);
    });

    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/calendar/events"),
      expect.anything(),
    );
  });

  it("returns without fetching when user cancels confirm", async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);
    const { result } = setup(mockInitialEvent);
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    await act(async () => {
      await result.current.handleDelete(mockOnSuccess);
    });

    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/calendar/events"),
      expect.anything(),
    );
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("alerts on invalid event ID", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    const { result } = setup({ ...mockInitialEvent, id: "bad-id" });
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    await act(async () => {
      await result.current.handleDelete(mockOnSuccess);
    });

    expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("Invalid event ID"));
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/calendar/events"),
      expect.anything(),
    );
  });

  it("DELETEs and calls onSuccess on confirmation", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    const { result } = setup(mockInitialEvent);
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    await act(async () => {
      await result.current.handleDelete(mockOnSuccess);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`id=${VALID_ID}`),
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("alerts on DELETE API error", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/categories")
        return Promise.resolve({ json: async () => mockCategories });
      return Promise.resolve({
        ok: false,
        json: async () => ({ message: "Delete failed" }),
      });
    });

    const { result } = setup(mockInitialEvent);
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    await act(async () => {
      await result.current.handleDelete(mockOnSuccess);
    });

    expect(global.alert).toHaveBeenCalledWith("Delete failed");
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("uses correct confirm message for single occurrence delete", async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);
    const { result } = setup(mockInitialEvent); // editMode defaults to "single"
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    await act(async () => {
      await result.current.handleDelete(mockOnSuccess);
    });

    expect(global.confirm).toHaveBeenCalledWith("Delete only this occurrence?");
  });

  it("uses correct confirm message for series delete", async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);
    const { result } = setup({ ...mockInitialEvent, recurrence: { type: "none" } });
    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    // editMode is "series" for non-recurring event
    await act(async () => {
      await result.current.handleDelete(mockOnSuccess);
    });

    expect(global.confirm).toHaveBeenCalledWith("Delete the entire series?");
  });
});