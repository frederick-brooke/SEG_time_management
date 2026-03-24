// undoApi.test.ts
import { restoreEvent } from "../undoApi";

global.fetch = jest.fn();

const BASE_EVENT = {
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

// ── fetch call ────────────────────────────────────────────────────────────

describe("restoreEvent fetch call", () => {
  it("calls the correct endpoint with POST", async () => {
    await restoreEvent(BASE_EVENT);
    expect(fetch).toHaveBeenCalledWith(
      "/api/calendar/events",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sets Content-Type header", async () => {
    await restoreEvent(BASE_EVENT);
    const options = (fetch as jest.Mock).mock.calls[0][1];
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("returns the fetch response", async () => {
    const mockResponse = { ok: true, status: 201 };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    const result = await restoreEvent(BASE_EVENT);
    expect(result).toBe(mockResponse);
  });
});

// ── body fields ───────────────────────────────────────────────────────────

describe("restoreEvent body", () => {
  const getBody = () => JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);

  it("maps event fields onto the body correctly", async () => {
    await restoreEvent(BASE_EVENT);
    const body = getBody();
    expect(body.title).toBe("Team Meeting");
    expect(body.description).toBe("Weekly sync");
    expect(body.allDay).toBe(false);
    expect(body.category).toBe("work");
  });

  it("converts start and end dates to ISO strings", async () => {
    await restoreEvent(BASE_EVENT);
    const body = getBody();
    expect(body.start).toBe("2024-06-15T10:00:00.000Z");
    expect(body.end).toBe("2024-06-15T11:00:00.000Z");
  });

  it("maps recurrence fields when present", async () => {
    await restoreEvent(BASE_EVENT);
    const body = getBody();
    expect(body.recurrenceType).toBe("weekly");
    expect(body.recurrenceDays).toEqual(["Mon"]);
    expect(body.recurrenceUntil).toBe("2024-12-31");
  });

  it("defaults recurrenceType to 'none' when recurrence is absent", async () => {
    await restoreEvent({ ...BASE_EVENT, recurrence: null });
    expect(getBody().recurrenceType).toBe("none");
  });

  it("defaults recurrenceType to 'none' when recurrence.type is absent", async () => {
    await restoreEvent({ ...BASE_EVENT, recurrence: { days: ["Mon"] } });
    expect(getBody().recurrenceType).toBe("none");
  });
});