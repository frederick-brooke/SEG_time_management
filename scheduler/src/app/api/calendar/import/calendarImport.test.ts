/**
 * Tests for the iCal calendar import feature.
 * Covers: parsing, POST/GET/DELETE handlers, upsert logic, auto-categorisation.
 */

if (!AbortSignal.timeout) {
  AbortSignal.timeout = (ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
  NextRequest: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { GET, POST, DELETE } from "@/app/api/calendar/import/route";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetServerSession = getServerSession as jest.Mock;

// iCal fixtures

const SINGLE_EVENT_ICAL = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-uid-001@example.com
SUMMARY:Team Meeting
DTSTART:20260310T090000Z
DTEND:20260310T100000Z
DESCRIPTION:Weekly sync
END:VEVENT
END:VCALENDAR`;

const ALL_DAY_ICAL = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:allday-001@example.com
SUMMARY:Bank Holiday
DTSTART;VALUE=DATE:20260325
DTEND;VALUE=DATE:20260326
END:VEVENT
END:VCALENDAR`;

const RECURRING_WEEKLY_ICAL = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:recurring-001@example.com
SUMMARY:Lecture
DTSTART:20260303T100000Z
DTEND:20260303T110000Z
RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20260430T000000Z
END:VEVENT
END:VCALENDAR`;

const EXDATE_ICAL = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:exdate-001@example.com
SUMMARY:Lab Session
DTSTART:20260303T140000Z
DTEND:20260303T160000Z
RRULE:FREQ=WEEKLY;BYDAY=TU;UNTIL=20260430T000000Z
EXDATE:20260310T140000Z
END:VEVENT
END:VCALENDAR`;

const DURATION_ICAL = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:duration-001@example.com
SUMMARY:Quick Standup
DTSTART:20260310T090000Z
DURATION:PT30M
END:VEVENT
END:VCALENDAR`;

const MULTI_EVENT_ICAL = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:multi-001@example.com
SUMMARY:Exam Revision
DTSTART:20260310T090000Z
DTEND:20260310T110000Z
END:VEVENT
BEGIN:VEVENT
UID:multi-002@example.com
SUMMARY:Lab Practical
DTSTART:20260311T130000Z
DTEND:20260311T150000Z
END:VEVENT
BEGIN:VEVENT
UID:multi-003@example.com
SUMMARY:Personal Appointment
DTSTART:20260312T100000Z
DTEND:20260312T110000Z
END:VEVENT
END:VCALENDAR`;

// Helpers

const TEST_URL = "https://example.com/cal.ics";

function makeRequest(body: object) {
  return new Request("http://localhost/api/calendar/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(body: object) {
  return new Request("http://localhost/api/calendar/import", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGetRequest() {
  return new Request("http://localhost/api/calendar/import", { method: "GET" });
}

function mockFetch(ical: string, status = 200) {
  jest.spyOn(global, "fetch").mockResolvedValueOnce(new Response(ical, { status }));
}

function encodePrefix(url: string) {
  return `ical:${Buffer.from(url).toString("base64")}:`;
}

function encodeImportId(url: string, uid: string) {
  return `${encodePrefix(url)}${uid}`;
}

// Setup
beforeEach(() => {
  jest.clearAllMocks();
  mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
  (mockPrisma.event.findFirst as jest.Mock).mockResolvedValue(null);
  (mockPrisma.event.create as jest.Mock).mockImplementation(({ data }) =>
    Promise.resolve({ id: "new-event-id", ...data })
  );
  (mockPrisma.event.update as jest.Mock).mockResolvedValue({});
  (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);
  (mockPrisma.event.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
});

// Auth
describe("Authentication", () => {
  beforeEach(() => mockGetServerSession.mockResolvedValue(null));

  test("POST returns 401 when not authenticated", async () => {
    const res = await POST(makeRequest({ url: TEST_URL }) as any);
    expect(res.status).toBe(401);
  });

  test("GET returns 401 when not authenticated", async () => {
    const res = await GET(makeGetRequest() as any);
    expect(res.status).toBe(401);
  });

  test("DELETE returns 401 when not authenticated", async () => {
    const res = await DELETE(makeDeleteRequest({ url: TEST_URL }) as any);
    expect(res.status).toBe(401);
  });
});

// URL validation

describe("POST — URL validation", () => {
  test("returns 400 when no URL is provided", async () => {
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(400);
    expect((await res.json()).message).toMatch(/no url/i);
  });

  test("returns 400 for an unsupported protocol", async () => {
    const res = await POST(makeRequest({ url: "ftp://example.com/cal.ics" }) as any);
    expect(res.status).toBe(400);
    expect((await res.json()).message).toMatch(/invalid url/i);
  });

  test("normalises webcal:// to https:// before fetching", async () => {
    const spy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(SINGLE_EVENT_ICAL, { status: 200 })
    );
    await POST(makeRequest({ url: "webcal://example.com/cal.ics" }) as any);
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\//), expect.any(Object));
    spy.mockRestore();
  });
});

// Fetch errors

describe("POST — fetch errors", () => {
  test("returns 422 when the remote server returns a non-200 status", async () => {
    mockFetch("Not Found", 404);
    const res = await POST(makeRequest({ url: TEST_URL }) as any);
    expect(res.status).toBe(422);
    expect((await res.json()).message).toMatch(/404/);
  });

  test("returns 422 when the URL is unreachable", async () => {
    jest.spyOn(global, "fetch").mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const res = await POST(makeRequest({ url: TEST_URL }) as any);
    expect(res.status).toBe(422);
    expect((await res.json()).message).toMatch(/could not reach/i);
  });

  test("returns 422 when the response is not a valid iCal file", async () => {
    mockFetch("<html>Not a calendar</html>");
    const res = await POST(makeRequest({ url: TEST_URL }) as any);
    expect(res.status).toBe(422);
    expect((await res.json()).message).toMatch(/valid ical/i);
  });
});

test("collapses double slashes in the URL path before fetching", async () => {
  const spy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
    new Response(SINGLE_EVENT_ICAL, { status: 200 })
  );
  await POST(makeRequest({ url: "https://example.com//api/cal.ics" }) as any);
  expect(spy).toHaveBeenCalledWith(
    "https://example.com/api/cal.ics",
    expect.any(Object)
  );
  spy.mockRestore();
});

// iCal parsing

describe("POST — iCal parsing", () => {
  test("imports a single event with correct fields", async () => {
    mockFetch(SINGLE_EVENT_ICAL);
    await POST(makeRequest({ url: TEST_URL }) as any);
    expect(mockPrisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Team Meeting",
          description: "Weekly sync",
          start: new Date("2026-03-10T09:00:00Z"),
          end: new Date("2026-03-10T10:00:00Z"),
        }),
      })
    );
  });

  test("correctly parses all-day events", async () => {
    mockFetch(ALL_DAY_ICAL);
    await POST(makeRequest({ url: TEST_URL }) as any);
    expect(mockPrisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ allDay: true }) })
    );
  });

  test("derives end time from DURATION when DTEND is absent", async () => {
    mockFetch(DURATION_ICAL);
    await POST(makeRequest({ url: TEST_URL }) as any);
    expect(mockPrisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          start: new Date("2026-03-10T09:00:00Z"),
          end: new Date("2026-03-10T09:30:00Z"),
        }),
      })
    );
  });

  test("parses RRULE into a recurrence object", async () => {
    mockFetch(RECURRING_WEEKLY_ICAL);
    await POST(makeRequest({ url: TEST_URL }) as any);
    expect(mockPrisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recurrence: expect.objectContaining({ type: "weekly" }),
        }),
      })
    );
  });

  test("stores EXDATE entries as exceptions", async () => {
    mockFetch(EXDATE_ICAL);
    await POST(makeRequest({ url: TEST_URL }) as any);
    expect(mockPrisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          exceptions: expect.arrayContaining([expect.stringContaining("2026-03-10")]),
        }),
      })
    );
  });

  test("imports all events from a multi-event feed", async () => {
    mockFetch(MULTI_EVENT_ICAL);
    const res = await POST(makeRequest({ url: TEST_URL }) as any);
    expect((await res.json()).created).toBe(3);
  });

  test("encodes the source URL inside googleEventId so it can be recovered", async () => {
    mockFetch(SINGLE_EVENT_ICAL);
    await POST(makeRequest({ url: TEST_URL }) as any);
    const { googleEventId } = (mockPrisma.event.create as jest.Mock).mock.calls[0][0].data;
    const b64 = googleEventId.slice(5, googleEventId.indexOf(":", 5));
    expect(Buffer.from(b64, "base64").toString()).toBe(TEST_URL);
  });
});

// Auto-categorisation

describe("POST — auto-categorisation", () => {
  test.each([
    ["Introduction lecture", "Lecture"],
    ["Biology Seminar",      "Lecture"],
    ["Chemistry Lab",        "Lab"],
    ["Final Exam",           "Exam"],
    ["Mid-term Assessment",  "Exam"],
    ["Revision Session",     "Individual Study"],
    ["Dentist Appointment",  "Personal"],
  ])('"%s" is categorised as %s', async (title, expectedCategory) => {
    const ical = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:cat@example.com\nSUMMARY:${title}\nDTSTART:20260310T090000Z\nDTEND:20260310T100000Z\nEND:VEVENT\nEND:VCALENDAR`;
    mockFetch(ical);
    await POST(makeRequest({ url: TEST_URL }) as any);
    expect(mockPrisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ category: expectedCategory }) })
    );
  });
});

// Upsert behaviour

describe("POST — upsert behaviour", () => {
  test("creates a new event when the UID has not been imported before", async () => {
    mockFetch(SINGLE_EVENT_ICAL);
    const res = await POST(makeRequest({ url: TEST_URL }) as any);
    const body = await res.json();
    expect(body.created).toBe(1);
    expect(body.updated).toBe(0);
    expect(mockPrisma.event.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.event.update).not.toHaveBeenCalled();
  });

  test("updates the event when the same UID is re-imported", async () => {
    mockFetch(SINGLE_EVENT_ICAL);
    (mockPrisma.event.findFirst as jest.Mock).mockResolvedValue({
      id: "existing-id", title: "Old Title", description: "", recurrence: null, exceptions: [],
    });
    const res = await POST(makeRequest({ url: TEST_URL }) as any);
    const body = await res.json();
    expect(body.updated).toBe(1);
    expect(body.created).toBe(0);
    expect(mockPrisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: "Team Meeting" }) })
    );
  });

  test("re-importing the same feed does not duplicate events", async () => {
    mockFetch(SINGLE_EVENT_ICAL);
    (mockPrisma.event.findFirst as jest.Mock).mockResolvedValueOnce(null);
    await POST(makeRequest({ url: TEST_URL }) as any);

    mockFetch(SINGLE_EVENT_ICAL);
    (mockPrisma.event.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "existing-id", title: "Team Meeting", description: "", recurrence: null, exceptions: [],
    });
    await POST(makeRequest({ url: TEST_URL }) as any);

    expect(mockPrisma.event.create).toHaveBeenCalledTimes(1);
  });

  test("same UID from two different feed URLs creates two separate events", async () => {
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(SINGLE_EVENT_ICAL, { status: 200 }))
      .mockResolvedValueOnce(new Response(SINGLE_EVENT_ICAL, { status: 200 }));

    await POST(makeRequest({ url: "https://feed-a.example.com/cal.ics" }) as any);
    await POST(makeRequest({ url: "https://feed-b.example.com/cal.ics" }) as any);

    expect(mockPrisma.event.create).toHaveBeenCalledTimes(2);
    const idA = (mockPrisma.event.create as jest.Mock).mock.calls[0][0].data.googleEventId;
    const idB = (mockPrisma.event.create as jest.Mock).mock.calls[1][0].data.googleEventId;
    expect(idA).not.toBe(idB);
  });
});

// GET — list imported feeds

describe("GET — list imported feeds", () => {
  test("returns an empty array when nothing has been imported", async () => {
    const res = await GET(makeGetRequest() as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("groups events by source URL and returns the correct counts", async () => {
    const urlA = "https://calendar-a.example.com/cal.ics";
    const urlB = "https://calendar-b.example.com/cal.ics";
    (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([
      { googleEventId: encodeImportId(urlA, "uid-1") },
      { googleEventId: encodeImportId(urlA, "uid-2") },
      { googleEventId: encodeImportId(urlB, "uid-3") },
    ]);

    const body = await (await GET(makeGetRequest() as any)).json();
    expect(body).toHaveLength(2);
    expect(body.find((f: any) => f.url === urlA).count).toBe(2);
    expect(body.find((f: any) => f.url === urlB).count).toBe(1);
  });

  test("ignores non-iCal events (e.g. native Google events)", async () => {
    (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([
      { googleEventId: "google-native-id" },
      { googleEventId: null },
    ]);
    expect(await (await GET(makeGetRequest() as any)).json()).toEqual([]);
  });
});

// DELETE — remove imported calendar

describe("DELETE — remove imported calendar", () => {
  test("returns 400 when no URL is provided", async () => {
    const res = await DELETE(makeDeleteRequest({}) as any);
    expect(res.status).toBe(400);
  });

  test("deletes all events from the given feed and returns the count", async () => {
    (mockPrisma.event.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
    const url = "https://example.com/cal.ics";
    const res = await DELETE(makeDeleteRequest({ url }) as any);
    const body = await res.json();

    expect(mockPrisma.event.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-123", googleEventId: { startsWith: encodePrefix(url) } },
    });
    expect(body.deleted).toBe(5);
    expect(body.message).toMatch(/5 events/i);
  });

  test("uses singular 'event' when count is 1", async () => {
    (mockPrisma.event.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    const body = await (await DELETE(makeDeleteRequest({ url: TEST_URL }) as any)).json();
    expect(body.message).toMatch(/1 event[^s]/);
  });

  test("only targets events from the specified feed URL", async () => {
    const urlA = "https://calendar-a.example.com/cal.ics";
    const urlB = "https://calendar-b.example.com/cal.ics";
    await DELETE(makeDeleteRequest({ url: urlA }) as any);
    const { where } = (mockPrisma.event.deleteMany as jest.Mock).mock.calls[0][0];
    expect(where.googleEventId.startsWith).toBe(encodePrefix(urlA));
    expect(where.googleEventId.startsWith).not.toBe(encodePrefix(urlB));
  });
});
