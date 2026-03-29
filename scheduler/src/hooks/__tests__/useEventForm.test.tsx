import { renderHook, act, waitFor } from "@testing-library/react";


const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockAlert = jest.fn();
global.alert = mockAlert;

const mockConfirm = jest.fn();
global.confirm = mockConfirm;

import { useEventForm } from "../Events/useEventForm";


const okJson = (data: any) =>
  Promise.resolve({ ok: true, json: async () => data });

const failRes = (msg = "Failed") =>
  Promise.resolve({ ok: false, json: async () => ({ message: msg }) });

const CATEGORIES_RESPONSE = { categories: [{ id: "cat-1", name: "Lecture" }] };

const makeInitialEvent = (overrides: any = {}) => ({
  id: "a1b2c3d4e5f6a1b2c3d4e5f6",
  title: "Existing Event",
  description: "Desc",
  category: "Lecture",
  start: "2025-06-01T10:00:00Z",
  end: "2025-06-01T11:00:00Z",
  recurrence: { type: "none" },
  startCoords: null,
  destinationCoords: null,
  startLocationName: "",
  destLocationName: "",
  transportMode: "walking",
  travelDuration: null,
  ...overrides,
});

const mockOnSuccess = jest.fn();

const makeSubmitEvent = (startDate: string, startTime: string, endDate: string, endTime: string) =>
  ({ preventDefault: jest.fn() } as any);


describe("useEventForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue(okJson(CATEGORIES_RESPONSE));
    mockConfirm.mockReturnValue(true);
  });

  // Initial state — new event
  it("initialises title as empty string for new event", () => {
    const { result } = renderHook(() =>
      useEventForm(null, "2025-06-01", "user-1", [])
    );
    expect(result.current.title).toBe("");
  });

  it("initialises category as Lecture for new event", () => {
    const { result } = renderHook(() =>
      useEventForm(null, "2025-06-01", "user-1", [])
    );
    expect(result.current.category).toBe("Lecture");
  });

  it("initialises recurrenceType as none for new event", () => {
    const { result } = renderHook(() =>
      useEventForm(null, "2025-06-01", "user-1", [])
    );
    expect(result.current.recurrenceType).toBe("none");
  });

  it("initialises transportMode as walking", () => {
    const { result } = renderHook(() =>
      useEventForm(null, "2025-06-01", "user-1", [])
    );
    expect(result.current.transportMode).toBe("walking");
  });

  // Initial state — existing event
  it("populates title from initialEvent", () => {
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent({ title: "My Event" }), "", "user-1", [])
    );
    expect(result.current.title).toBe("My Event");
  });

  it("populates description from initialEvent", () => {
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent({ description: "My Desc" }), "", "user-1", [])
    );
    expect(result.current.description).toBe("My Desc");
  });

  it("populates category from initialEvent", () => {
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent({ category: "Exam" }), "", "user-1", [])
    );
    expect(result.current.category).toBe("Exam");
  });

  it("sets isGoogle to true for Google events", () => {
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent({ isGoogleEvent: true }), "", "user-1", [])
    );
    expect(result.current.isGoogle).toBe(true);
  });

  it("sets isGoogle to false for non-Google events", () => {
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent(), "", "user-1", [])
    );
    expect(result.current.isGoogle).toBe(false);
  });

  it("sets isRecurringEv to true for recurring events", () => {
    const { result } = renderHook(() =>
      useEventForm(
        makeInitialEvent({ recurrence: { type: "weekly", days: ["Mon"] } }),
        "",
        "user-1",
        []
      )
    );
    expect(result.current.isRecurringEv).toBe(true);
  });

  // Categories fetch
  it("fetches categories on mount", async () => {
    const { result } = renderHook(() =>
      useEventForm(null, "2025-06-01", "user-1", [])
    );
    await waitFor(() => expect(result.current.categories.length).toBeGreaterThan(0));
    expect(mockFetch).toHaveBeenCalledWith("/api/categories");
  });

  it("populates categories state from API", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ categories: [{ id: "cat-1", name: "Lecture" }] }));
    const { result } = renderHook(() =>
      useEventForm(null, "2025-06-01", "user-1", [])
    );
    await waitFor(() => expect(result.current.categories).toHaveLength(1));
  });

  // handleSubmit — validation
  it("handleSubmit does nothing when isGoogle is true", async () => {
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent({ isGoogleEvent: true }), "", "user-1", [])
    );
    const e = { preventDefault: jest.fn() } as any;
    await act(async () => { await result.current.handleSubmit(e, mockOnSuccess); });
    expect(mockFetch).not.toHaveBeenCalledWith(
      "/api/calendar/events",
      expect.anything()
    );
  });

  it("handleSubmit alerts when end time is before start time", async () => {
    const { result } = renderHook(() =>
      useEventForm(null, "2025-06-01", "user-1", [])
    );
    act(() => {
      result.current.setStartDate("2025-06-01");
      result.current.setStartTime("11:00");
      result.current.setEndDate("2025-06-01");
      result.current.setEndTime("10:00");
    });
    const e = { preventDefault: jest.fn() } as any;
    await act(async () => { await result.current.handleSubmit(e, mockOnSuccess); });
    expect(mockAlert).toHaveBeenCalledWith("End time must be after start time");
  });

  it("handleSubmit shows conflict dialog when overlapping event exists", async () => {
    const existing = {
      id: "other",
      start: "2025-06-01T09:30:00Z",
      end: "2025-06-01T10:30:00Z",
    };
    const { result } = renderHook(() =>
      useEventForm(null, "2025-06-01", "user-1", [existing])
    );
    act(() => {
      result.current.setStartDate("2025-06-01");
      result.current.setStartTime("10:00");
      result.current.setEndDate("2025-06-01");
      result.current.setEndTime("11:00");
    });
    const e = { preventDefault: jest.fn() } as any;
    await act(async () => { await result.current.handleSubmit(e, mockOnSuccess); });
    expect(result.current.showConflict).toBe(true);
  });

  it("handleSubmit saves event when no conflict exists", async () => {
    mockFetch.mockResolvedValueOnce(okJson(CATEGORIES_RESPONSE)); // categories
    mockFetch.mockResolvedValueOnce(okJson({ id: "new-id" })); // save
    const { result } = renderHook(() =>
      useEventForm(null, "2025-06-01", "user-1", [])
    );
    await waitFor(() => expect(result.current.categories.length).toBeGreaterThan(0));
    act(() => {
      result.current.setTitle("New Event");
      result.current.setStartDate("2025-06-01");
      result.current.setStartTime("10:00");
      result.current.setEndDate("2025-06-01");
      result.current.setEndTime("11:00");
    });
    const e = { preventDefault: jest.fn() } as any;
    await act(async () => { await result.current.handleSubmit(e, mockOnSuccess); });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/calendar/events",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("handleSubmit uses PATCH when editing an existing event", async () => {
    mockFetch.mockResolvedValueOnce(okJson(CATEGORIES_RESPONSE));
    mockFetch.mockResolvedValueOnce(okJson({ id: "existing-id" }));
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent(), "", "user-1", [])
    );
    await waitFor(() => expect(result.current.categories.length).toBeGreaterThan(0));
    const e = { preventDefault: jest.fn() } as any;
    await act(async () => { await result.current.handleSubmit(e, mockOnSuccess); });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/calendar/events",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("handleSubmit calls onSuccess after editing an existing event", async () => {
    mockFetch.mockResolvedValueOnce(okJson(CATEGORIES_RESPONSE));
    mockFetch.mockResolvedValueOnce(okJson({ id: "existing-id" }));
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent(), "", "user-1", [])
    );
    await waitFor(() => expect(result.current.categories.length).toBeGreaterThan(0));
    const e = { preventDefault: jest.fn() } as any;
    await act(async () => { await result.current.handleSubmit(e, mockOnSuccess); });
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("handleSubmit alerts when save fails", async () => {
    mockFetch.mockResolvedValueOnce(okJson(CATEGORIES_RESPONSE));
    mockFetch.mockResolvedValueOnce(failRes("Save error"));
    const { result } = renderHook(() =>
      useEventForm(null, "2025-06-01", "user-1", [])
    );
    await waitFor(() => expect(result.current.categories.length).toBeGreaterThan(0));
    act(() => {
      result.current.setStartDate("2025-06-01");
      result.current.setStartTime("10:00");
      result.current.setEndDate("2025-06-01");
      result.current.setEndTime("11:00");
    });
    const e = { preventDefault: jest.fn() } as any;
    await act(async () => { await result.current.handleSubmit(e, mockOnSuccess); });
    expect(mockAlert).toHaveBeenCalledWith("Save error");
  });

  // handleDelete
  it("handleDelete does nothing when no initialEvent id", async () => {
    const { result } = renderHook(() =>
      useEventForm(null, "2025-06-01", "user-1", [])
    );
    await act(async () => { await result.current.handleDelete(mockOnSuccess); });
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/calendar/events"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("handleDelete does nothing when isGoogle is true", async () => {
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent({ isGoogleEvent: true }), "", "user-1", [])
    );
    await act(async () => { await result.current.handleDelete(mockOnSuccess); });
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/calendar/events"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("handleDelete does nothing when user cancels confirm", async () => {
    mockConfirm.mockReturnValue(false);
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent(), "", "user-1", [])
    );
    await act(async () => { await result.current.handleDelete(mockOnSuccess); });
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining("DELETE"),
      expect.anything()
    );
  });

  it("handleDelete alerts for invalid event id format", async () => {
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent({ id: "bad-id" }), "", "user-1", [])
    );
    await act(async () => { await result.current.handleDelete(mockOnSuccess); });
    expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining("Invalid event ID"));
  });

  it("handleDelete sends DELETE request for valid event id", async () => {
    mockFetch.mockResolvedValueOnce(okJson(CATEGORIES_RESPONSE));
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent(), "", "user-1", [])
    );
    await act(async () => { await result.current.handleDelete(mockOnSuccess); });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/calendar/events"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("handleDelete calls onSuccess after successful delete", async () => {
    mockFetch.mockResolvedValueOnce(okJson(CATEGORIES_RESPONSE));
    mockFetch.mockResolvedValueOnce(okJson({}));
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent(), "", "user-1", [])
    );
    await act(async () => { await result.current.handleDelete(mockOnSuccess); });
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("handleDelete alerts when DELETE fails", async () => {
    mockFetch.mockResolvedValueOnce(okJson(CATEGORIES_RESPONSE));
    mockFetch.mockResolvedValueOnce(failRes("Delete failed"));
    const { result } = renderHook(() =>
      useEventForm(makeInitialEvent(), "", "user-1", [])
    );
    await act(async () => { await result.current.handleDelete(mockOnSuccess); });
    expect(mockAlert).toHaveBeenCalledWith("Delete failed");
  });

  // travelTimeMode
  it("defaults travelTimeMode to auto when event has coords", () => {
    const { result } = renderHook(() =>
      useEventForm(
        makeInitialEvent({ startCoords: { lat: 51.5, lng: -0.1 }, destinationCoords: { lat: 51.6, lng: -0.2 }, travelDuration: 30 }),
        "",
        "user-1",
        []
      )
    );
    expect(result.current.travelTimeMode).toBe("auto");
  });

  it("defaults travelTimeMode to manual when event has duration but no coords", () => {
    const { result } = renderHook(() =>
      useEventForm(
        makeInitialEvent({ startCoords: null, destinationCoords: null, travelDuration: 30 }),
        "",
        "user-1",
        []
      )
    );
    expect(result.current.travelTimeMode).toBe("manual");
  });
});
