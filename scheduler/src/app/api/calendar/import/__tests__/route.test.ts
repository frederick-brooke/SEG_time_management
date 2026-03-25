/**
 * Tests for the iCal Calendar Import API route.
 */

import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "../route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { parseICal, parseRRule } from "@/lib/calendar/ical-parser";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
  NextRequest: jest.requireActual("next/server").NextRequest,
}));

jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
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
jest.mock("@/lib/calendar/ical-parser", () => ({
  parseICal: jest.fn(),
  parseRRule: jest.fn(),
}));

// Mock global fetch used by fetchICalText
global.fetch = jest.fn();

// ── Typed mock helpers ────────────────────────────────────────────────────────

const mockGetServerSession = getServerSession as jest.Mock;
const mockPrismaEvent = prisma.event as unknown as {
  findMany: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  deleteMany: jest.Mock;
};
const mockParseICal = parseICal as jest.Mock;
const mockParseRRule = parseRRule as jest.Mock;
const mockFetch = global.fetch as jest.Mock;

// ── Factory helpers ───────────────────────────────────────────────────────────

/**
 * Creates a mock authenticated session.
 * @param userId - The user ID to include in the session
 */
function createSession(userId = "user-123") {
  return { user: { id: userId } };
}

/**
 * Encodes a URL into the ical: googleEventId format used by the route.
 */
function encodeImportId(url: string, uid: string): string {
  const encoded = Buffer.from(url).toString("base64");
  return `ical:${encoded}:${uid}`;
}

/**
 * Creates a mock parsed iCal event (ParsedVEvent shape).
 */
function createMockVEvent(overrides = {}) {
  return {
    uid: "event-uid-1",
    summary: "Test Lecture",
    description: "A test event",
    dtstart: new Date("2024-06-01T10:00:00Z"),
    dtend: new Date("2024-06-01T11:00:00Z"),
    allDay: false,
    rrule: null,
    exdates: [],
    ...overrides,
  };
}

/**
 * Creates a mock fetch response returning valid iCal text.
 */
function mockValidICalFetch(icalText: string) {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => "text/calendar" },
    text: async () => icalText,
  });
}

/**
 * Minimal valid iCal feed string.
 */
const VALID_ICAL = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:event-uid-1\nSUMMARY:Test Lecture\nDTSTART:20240601T100000Z\nDTEND:20240601T110000Z\nEND:VEVENT\nEND:VCALENDAR`;

/**
 * Builds a NextRequest-compatible request using the standard Request API.
 */
function makeRequest(
  method: string,
  url: string,
  body?: object
): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new Request(url, init) as unknown as NextRequest;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("iCal Import API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────────────────────────────

  describe("GET", () => {
    it("should return 401 when the user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const res = await GET(makeRequest("GET", "http://localhost/api/calendar/import"));

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: "Not authenticated" });
    });

    it("should return an empty array when no feeds have been imported", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.findMany.mockResolvedValue([]);

      const res = await GET(makeRequest("GET", "http://localhost/api/calendar/import"));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    it("should return deduplicated feeds with correct event counts", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      const url = "https://example.com/calendar.ics";
      mockPrismaEvent.findMany.mockResolvedValue([
        { googleEventId: encodeImportId(url, "uid-1") },
        { googleEventId: encodeImportId(url, "uid-2") },
        { googleEventId: encodeImportId(url, "uid-3") },
      ]);

      const res = await GET(makeRequest("GET", "http://localhost/api/calendar/import"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([{ url, count: 3 }]);
    });

    it("should return separate entries for different feed URLs", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      const url1 = "https://example.com/calendar1.ics";
      const url2 = "https://example.com/calendar2.ics";
      mockPrismaEvent.findMany.mockResolvedValue([
        { googleEventId: encodeImportId(url1, "uid-1") },
        { googleEventId: encodeImportId(url2, "uid-2") },
      ]);

      const res = await GET(makeRequest("GET", "http://localhost/api/calendar/import"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(2);
      expect(body).toEqual(
        expect.arrayContaining([
          { url: url1, count: 1 },
          { url: url2, count: 1 },
        ])
      );
    });

    it("should query only events with ical: prefix in googleEventId", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.findMany.mockResolvedValue([]);

      await GET(makeRequest("GET", "http://localhost/api/calendar/import"));

      expect(mockPrismaEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            googleEventId: expect.objectContaining({ startsWith: "ical:" }),
          }),
        })
      );
    });

    it("should skip events with a malformed googleEventId", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.findMany.mockResolvedValue([
        { googleEventId: "ical:notbase64withoutcolon" },
        { googleEventId: null },
      ]);

      const res = await GET(makeRequest("GET", "http://localhost/api/calendar/import"));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    });
  });

  // ── POST ──────────────────────────────────────────────────────────────────

  describe("POST", () => {
    it("should return 401 when the user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const res = await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );

      expect(res.status).toBe(401);
    });

    it("should return 400 when the request body is invalid JSON", async () => {
      mockGetServerSession.mockResolvedValue(createSession());

      // Send a request with no body so req.json() throws
      const res = await POST(makeRequest("POST", "http://localhost/api/calendar/import"));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "Invalid request body" });
    });

    it("should return 400 when no URL is provided", async () => {
      mockGetServerSession.mockResolvedValue(createSession());

      const res = await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", { url: "" })
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "No URL provided" });
    });

    it("should return 400 when the URL format is invalid", async () => {
      mockGetServerSession.mockResolvedValue(createSession());

      const res = await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "ftp://invalid-protocol.com/cal.ics",
        })
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "Invalid URL format" });
    });

    it("should normalise webcal:// URLs to https://", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockValidICalFetch(VALID_ICAL);
      mockParseICal.mockReturnValue([createMockVEvent()]);
      mockPrismaEvent.findFirst.mockResolvedValue(null);
      mockPrismaEvent.create.mockResolvedValue({});

      await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "webcal://example.com/calendar.ics",
        })
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/calendar.ics",
        expect.any(Object)
      );
    });

    it("should return 422 when the remote URL cannot be fetched", async () => {
        mockGetServerSession.mockResolvedValue(createSession());
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          headers: { get: () => null },
          text: async () => "",
        });
      
        const res = await POST(
          makeRequest("POST", "http://localhost/api/calendar/import", {
            url: "https://example.com/calendar.ics",
          })
        );
      
        expect(res.status).toBe(422);
        expect(await res.json()).toMatchObject({ message: expect.stringContaining("Failed to fetch calendar") });
    });

    it("should return 422 when the fetch throws a network error", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockFetch.mockRejectedValue(new Error("Network failure"));

      const res = await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );

      expect(res.status).toBe(422);
    });

    it("should return 422 when the response is not a valid iCal feed", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "text/html" },
        text: async () => "<html><body>Not a calendar</body></html>",
      });

      const res = await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );

      expect(res.status).toBe(422);
      expect(await res.json()).toMatchObject({
        message: expect.stringContaining("iCal"),
      });
    });

    it("should return 422 when the iCal feed contains no events", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "text/calendar" },
        text: async () => "BEGIN:VCALENDAR\nBEGIN:VEVENT\nEND:VEVENT\nEND:VCALENDAR",
      });
      mockParseICal.mockReturnValue([]);

      const res = await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );

      expect(res.status).toBe(422);
      expect(await res.json()).toMatchObject({
        message: expect.stringContaining("No events"),
      });
    });

    it("should create new events and return correct counts", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockValidICalFetch(VALID_ICAL);
      mockParseICal.mockReturnValue([createMockVEvent()]);
      mockPrismaEvent.findFirst.mockResolvedValue(null);
      mockPrismaEvent.create.mockResolvedValue({});

      const res = await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.created).toBe(1);
      expect(body.updated).toBe(0);
      expect(body.skipped).toBe(0);
      expect(body.total).toBe(1);
      expect(mockPrismaEvent.create).toHaveBeenCalled();
    });

    it("should update existing events and return correct counts", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockValidICalFetch(VALID_ICAL);
      mockParseICal.mockReturnValue([createMockVEvent()]);
      mockPrismaEvent.findFirst.mockResolvedValue({
        id: "existing-id",
        description: "Old description",
        recurrence: null,
        exceptions: [],
      });
      mockPrismaEvent.update.mockResolvedValue({});

      const res = await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.created).toBe(0);
      expect(body.updated).toBe(1);
      expect(mockPrismaEvent.update).toHaveBeenCalled();
    });

    it("should increment skipped count when upserting an event throws", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockValidICalFetch(VALID_ICAL);
      mockParseICal.mockReturnValue([createMockVEvent()]);
      mockPrismaEvent.findFirst.mockRejectedValue(new Error("DB error"));

      const res = await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.skipped).toBe(1);
      expect(body.created).toBe(0);
    });

    it("should parse rrule when the event has recurrence", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockValidICalFetch(VALID_ICAL);
      const rrule = "FREQ=WEEKLY;BYDAY=MO";
      mockParseICal.mockReturnValue([createMockVEvent({ rrule })]);
      mockParseRRule.mockReturnValue({ type: "weekly", days: ["MO"] });
      mockPrismaEvent.findFirst.mockResolvedValue(null);
      mockPrismaEvent.create.mockResolvedValue({});

      await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );

      expect(mockParseRRule).toHaveBeenCalledWith(rrule);
    });

    it("should correctly infer category from event title", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockValidICalFetch(VALID_ICAL);
      mockParseICal.mockReturnValue([createMockVEvent({ summary: "CS101 Exam" })]);
      mockPrismaEvent.findFirst.mockResolvedValue(null);
      mockPrismaEvent.create.mockResolvedValue({});

      await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );

      expect(mockPrismaEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ category: "Exam" }),
        })
      );
    });

    it("should handle multiple events in a single feed", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockValidICalFetch(VALID_ICAL);
      mockParseICal.mockReturnValue([
        createMockVEvent({ uid: "uid-1" }),
        createMockVEvent({ uid: "uid-2" }),
        createMockVEvent({ uid: "uid-3" }),
      ]);
      mockPrismaEvent.findFirst.mockResolvedValue(null);
      mockPrismaEvent.create.mockResolvedValue({});

      const res = await POST(
        makeRequest("POST", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );
      const body = await res.json();

      expect(body.created).toBe(3);
      expect(body.total).toBe(3);
    });
  });

  // ── DELETE ────────────────────────────────────────────────────────────────

  describe("DELETE", () => {
    it("should return 401 when the user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );

      expect(res.status).toBe(401);
    });

    it("should return 400 when the request body is invalid JSON", async () => {
      mockGetServerSession.mockResolvedValue(createSession());

      const res = await DELETE(makeRequest("DELETE", "http://localhost/api/calendar/import"));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "Invalid request body" });
    });

    it("should return 400 when no URL is provided", async () => {
      mockGetServerSession.mockResolvedValue(createSession());

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/calendar/import", { url: "" })
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "No URL provided" });
    });

    it("should delete all events from the given feed and return the count", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.deleteMany.mockResolvedValue({ count: 5 });

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.deleted).toBe(5);
      expect(body.message).toContain("5");
    });

    it("should use singular 'event' in message when only one event is deleted", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.deleteMany.mockResolvedValue({ count: 1 });

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );
      const body = await res.json();

      expect(body.message).toContain("1 event");
      expect(body.message).not.toContain("events");
    });

    it("should use plural 'events' in message when multiple events are deleted", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.deleteMany.mockResolvedValue({ count: 3 });

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );
      const body = await res.json();

      expect(body.message).toContain("events");
    });

    it("should delete only events matching the encoded URL prefix", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.deleteMany.mockResolvedValue({ count: 2 });
      const url = "https://example.com/calendar.ics";
      const expectedPrefix = `ical:${Buffer.from(url).toString("base64")}:`;

      await DELETE(
        makeRequest("DELETE", "http://localhost/api/calendar/import", { url })
      );

      expect(mockPrismaEvent.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            googleEventId: expect.objectContaining({ startsWith: expectedPrefix }),
          }),
        })
      );
    });

    it("should return 500 when deleteMany throws", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.deleteMany.mockRejectedValue(new Error("DB failure"));

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/calendar/import", {
          url: "https://example.com/calendar.ics",
        })
      );

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ message: "DB failure" });
    });
  });
});