// undoApi.test.ts
import { restoreEvent } from "../undoApi";

global.fetch = jest.fn();

const BASE_EVENT = {
  id: "event-1",
  title: "Team Meeting",
  description: "Weekly sync",
  start: new Date("2024-06-15T10:00:00.000Z"),
  end: new Date("2024-06-15T11:00:00.000Z"),
  allDay: false,
  category: "work",
  recurrence: { type: "weekly", days: ["Mon"], until: "2024-12-31" },
};

beforeEach(() => {
  jest.clearAllMocks();
  (fetch as jest.Mock).mockResolvedValue({ ok: true });
});

// ── full mode: fetch call ─────────────────────────────────────────────────
describe('restoreEvent mode="full" fetch call', () => {
  it("calls the correct endpoint with POST", async () => {
    await restoreEvent(BASE_EVENT, "full");
    expect(fetch).toHaveBeenCalledWith(
      "/api/calendar/events",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sets Content-Type header", async () => {
    await restoreEvent(BASE_EVENT, "full");
    const options = (fetch as jest.Mock).mock.calls[0][1];
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("returns the fetch response", async () => {
    const mockResponse = { ok: true, status: 201 };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    const result = await restoreEvent(BASE_EVENT, "full");
    expect(result).toBe(mockResponse);
  });
});

// ── full mode: body fields ────────────────────────────────────────────────
describe('restoreEvent mode="full" body', () => {
  const getBody = () => JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);

  it("maps event fields onto the body correctly", async () => {
    await restoreEvent(BASE_EVENT, "full");
    const body = getBody();
    expect(body.title).toBe("Team Meeting");
    expect(body.description).toBe("Weekly sync");
    expect(body.allDay).toBe(false);
    expect(body.category).toBe("work");
  });

  it("converts start and end dates to ISO strings", async () => {
    await restoreEvent(BASE_EVENT, "full");
    const body = getBody();
    expect(body.start).toBe("2024-06-15T10:00:00.000Z");
    expect(body.end).toBe("2024-06-15T11:00:00.000Z");
  });

  it("maps recurrence fields when present", async () => {
    await restoreEvent(BASE_EVENT, "full");
    const body = getBody();
    expect(body.recurrenceType).toBe("weekly");
    expect(body.recurrenceDays).toEqual(["Mon"]);
    expect(body.recurrenceUntil).toBe("2024-12-31");
  });

  it("defaults recurrenceType to 'none' when recurrence is absent", async () => {
    await restoreEvent({ ...BASE_EVENT, recurrence: undefined }, "full");
    expect(getBody().recurrenceType).toBe("none");
  });

  it("defaults recurrenceType to 'none' when recurrence.type is absent", async () => {
    await restoreEvent({ ...BASE_EVENT, recurrence: { days: ["Mon"] } as any }, "full");
    expect(getBody().recurrenceType).toBe("none");
  });
});

// ── single mode: fetch call ───────────────────────────────────────────────
describe('restoreEvent mode="single" fetch call', () => {
  it("calls the correct endpoint with PATCH", async () => {
    await restoreEvent(BASE_EVENT, "single");
    expect(fetch).toHaveBeenCalledWith(
      "/api/calendar/events",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("sets Content-Type header", async () => {
    await restoreEvent(BASE_EVENT, "single");
    const options = (fetch as jest.Mock).mock.calls[0][1];
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("returns the fetch response", async () => {
    const mockResponse = { ok: true, status: 200 };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    const result = await restoreEvent(BASE_EVENT, "single");
    expect(result).toBe(mockResponse);
  });
});

// ── single mode: body fields ──────────────────────────────────────────────
describe('restoreEvent mode="single" body', () => {
  const getBody = () => JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);

  it("sends the event id", async () => {
    await restoreEvent(BASE_EVENT, "single");
    expect(getBody().id).toBe("event-1");
  });

  it("sends mode as removeException", async () => {
    await restoreEvent(BASE_EVENT, "single");
    expect(getBody().mode).toBe("removeException");
  });

  it("sends start date as exceptionDate ISO string", async () => {
    await restoreEvent(BASE_EVENT, "single");
    expect(getBody().exceptionDate).toBe("2024-06-15T10:00:00.000Z");
  });
});
