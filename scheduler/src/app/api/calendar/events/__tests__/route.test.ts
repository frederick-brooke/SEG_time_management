/**
 * Tests for the Calendar Events API route.
 */

import { NextRequest } from "next/server";
import { GET, POST, PUT, PATCH, DELETE } from "../route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { calculateTravelTime } from "@/lib/travel";
import { expandRecurringEvents } from "@/lib/calendar/eventHelpers";
import {
  syncGoogleCalendar,
  insertGoogleEvent,
  createLocalEvent,
  deleteGoogleEvent,
  deleteSingleOccurrence,
  upsertGoogleEvent,
  fetchAllGoogleEvents,
} from "@/lib/calendar/googleSync";
import {
  handleSingleInstanceUpdate,
  handleSeriesUpdate,
} from "@/lib/calendar/eventMutations";

// ── Mocks ─────────

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
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
jest.mock("@/lib/travel", () => ({ calculateTravelTime: jest.fn() }));
jest.mock("@/lib/calendar/eventHelpers", () => ({
  expandRecurringEvents: jest.fn((events) => events),
}));
jest.mock("@/lib/calendar/googleSync", () => ({
  syncGoogleCalendar: jest.fn(),
  insertGoogleEvent: jest.fn(),
  createLocalEvent: jest.fn(),
  deleteGoogleEvent: jest.fn(),
  deleteSingleOccurrence: jest.fn(),
  upsertGoogleEvent: jest.fn(),
  fetchAllGoogleEvents: jest.fn(),
}));
jest.mock("@/lib/calendar/eventMutations", () => ({
  handleSingleInstanceUpdate: jest.fn(),
  handleSeriesUpdate: jest.fn(),
}));
jest.mock("mongodb", () => ({
  ObjectId: { isValid: jest.fn((id) => /^[a-f\d]{24}$/i.test(id)) },
}));

// ── Typed mock helpers ─────

const mockGetServerSession = getServerSession as jest.Mock;
const mockPrismaEvent = prisma.event as unknown as {
  count: jest.Mock;
  findMany: jest.Mock;
  findFirst: jest.Mock;
  delete: jest.Mock;
};
const mockCalculateTravelTime = calculateTravelTime as jest.Mock;
const mockExpandRecurringEvents = expandRecurringEvents as jest.Mock;
const mockSyncGoogleCalendar = syncGoogleCalendar as jest.Mock;
const mockInsertGoogleEvent = insertGoogleEvent as jest.Mock;
const mockCreateLocalEvent = createLocalEvent as jest.Mock;
const mockDeleteGoogleEvent = deleteGoogleEvent as jest.Mock;
const mockDeleteSingleOccurrence = deleteSingleOccurrence as jest.Mock;
const mockUpsertGoogleEvent = upsertGoogleEvent as jest.Mock;
const mockFetchAllGoogleEvents = fetchAllGoogleEvents as jest.Mock;
const mockHandleSingleInstanceUpdate = handleSingleInstanceUpdate as jest.Mock;
const mockHandleSeriesUpdate = handleSeriesUpdate as jest.Mock;

// ── Factory helpers 

/**
 * Creates a mock authenticated session.
 * @param userId - The user ID to include in the session
 */
function createSession(userId = "user-123") {
  return { user: { id: userId }, accessToken: "token" };
}

/**
 * Creates a mock event object as returned by Prisma.
 */
function createMockEvent(overrides = {}) {
  return {
    id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    userId: "user-123",
    title: "Test Event",
    description: "A test event",
    start: new Date("2024-06-01T10:00:00Z"),
    end: new Date("2024-06-01T11:00:00Z"),
    allDay: false,
    category: "work",
    googleEventId: "google-event-id",
    exceptions: [],
    recurrenceType: null,
    ...overrides,
  };
}

/**
 * Builds a NextRequest-compatible request using the standard Request API.
 * Cast to NextRequest since route handlers only use .url and .json() at runtime.
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

// ── Tests 

describe("Calendar Events API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExpandRecurringEvents.mockImplementation((events) => events);
  });

  // ── GET ────────

  describe("GET", () => {
    it("should return 401 when the user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const res = await GET(makeRequest("GET", "http://localhost/api/events"));

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: "Not authenticated" });
    });

    it("should return events for an authenticated user", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.count.mockResolvedValue(5);
      const events = [createMockEvent()];
      mockPrismaEvent.findMany.mockResolvedValue(events);

      const res = await GET(makeRequest("GET", "http://localhost/api/events"));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(events);
    });

    it("should trigger a Google sync when no local events exist", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.count.mockResolvedValue(0);
      mockPrismaEvent.findMany.mockResolvedValue([]);

      await GET(makeRequest("GET", "http://localhost/api/events"));

      expect(mockSyncGoogleCalendar).toHaveBeenCalledWith("user-123", expect.any(Number));
    });

    it("should trigger a Google sync when force=true is passed", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.count.mockResolvedValue(10);
      mockPrismaEvent.findMany.mockResolvedValue([]);

      await GET(makeRequest("GET", "http://localhost/api/events?force=true"));

      expect(mockSyncGoogleCalendar).toHaveBeenCalled();
    });

    it("should not trigger a sync when events exist and interval has not elapsed", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.count.mockResolvedValue(10);
      mockPrismaEvent.findMany.mockResolvedValue([]);

      // First call sets lastSyncTime via force=true
      await GET(makeRequest("GET", "http://localhost/api/events?force=true"));
      mockSyncGoogleCalendar.mockClear();

      // Second call — interval not elapsed, events exist
      await GET(makeRequest("GET", "http://localhost/api/events"));

      expect(mockSyncGoogleCalendar).not.toHaveBeenCalled();
    });

    it("should filter events by search query", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.count.mockResolvedValue(5);
      mockPrismaEvent.findMany.mockResolvedValue([]);

      await GET(makeRequest("GET", "http://localhost/api/events?q=meeting"));

      expect(mockPrismaEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.objectContaining({ contains: "meeting" }) }),
            ]),
          }),
        })
      );
    });

    it("should filter events by category", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.count.mockResolvedValue(5);
      mockPrismaEvent.findMany.mockResolvedValue([]);

      await GET(makeRequest("GET", "http://localhost/api/events?category=work"));

      expect(mockPrismaEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "work" }),
        })
      );
    });

    it("should not apply category filter when category=all", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.count.mockResolvedValue(5);
      mockPrismaEvent.findMany.mockResolvedValue([]);

      await GET(makeRequest("GET", "http://localhost/api/events?category=all"));

      const call = mockPrismaEvent.findMany.mock.calls[0][0];
      expect(call.where.category).toBeUndefined();
    });

    it("should call expandRecurringEvents on the results", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.count.mockResolvedValue(5);
      const events = [createMockEvent()];
      mockPrismaEvent.findMany.mockResolvedValue(events);

      await GET(makeRequest("GET", "http://localhost/api/events"));

      expect(mockExpandRecurringEvents).toHaveBeenCalledWith(events);
    });
  });

  // ── POST ───────

  describe("POST", () => {
    it("should return 401 when the user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const res = await POST(
        makeRequest("POST", "http://localhost/api/events", { title: "Test" })
      );

      expect(res.status).toBe(401);
    });

    it("should create an event and return 201", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockInsertGoogleEvent.mockResolvedValue("google-id");
      const newEvent = createMockEvent();
      mockCreateLocalEvent.mockResolvedValue(newEvent);

      const res = await POST(
        makeRequest("POST", "http://localhost/api/events", {
          title: "Test Event",
          start: "2024-06-01T10:00",
          end: "2024-06-01T11:00",
        })
      );

      expect(res.status).toBe(201);
      expect(mockInsertGoogleEvent).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({ title: "Test Event" })
      );
      expect(mockCreateLocalEvent).toHaveBeenCalled();
    });

    it("should calculate travel time when coords are provided but travelDuration is not", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockCalculateTravelTime.mockResolvedValue(15);
      mockInsertGoogleEvent.mockResolvedValue("google-id");
      mockCreateLocalEvent.mockResolvedValue(createMockEvent());

      await POST(
        makeRequest("POST", "http://localhost/api/events", {
          title: "Trip",
          start: "2024-06-01T10:00",
          end: "2024-06-01T11:00",
          startCoords: [51.5, -0.1],
          destCoords: [51.6, -0.2],
          transportMode: "driving",
        })
      );

      expect(mockCalculateTravelTime).toHaveBeenCalledWith(
        [51.5, -0.1],
        [51.6, -0.2],
        "driving"
      );
    });

    it("should not recalculate travel time when travelDuration is already provided", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockInsertGoogleEvent.mockResolvedValue("google-id");
      mockCreateLocalEvent.mockResolvedValue(createMockEvent());

      await POST(
        makeRequest("POST", "http://localhost/api/events", {
          title: "Trip",
          start: "2024-06-01T10:00",
          end: "2024-06-01T11:00",
          startCoords: [51.5, -0.1],
          destCoords: [51.6, -0.2],
          travelDuration: 20,
        })
      );

      expect(mockCalculateTravelTime).not.toHaveBeenCalled();
    });

    it("should set recurrenceData to null when recurrenceType is 'none'", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockInsertGoogleEvent.mockResolvedValue("google-id");
      mockCreateLocalEvent.mockResolvedValue(createMockEvent());

      await POST(
        makeRequest("POST", "http://localhost/api/events", {
          title: "Test",
          start: "2024-06-01T10:00",
          end: "2024-06-01T11:00",
          recurrenceType: "none",
        })
      );

      expect(mockInsertGoogleEvent).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({ recurrenceData: null })
      );
    });

    it("should build recurrenceData when recurrenceType is provided", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockInsertGoogleEvent.mockResolvedValue("google-id");
      mockCreateLocalEvent.mockResolvedValue(createMockEvent());

      await POST(
        makeRequest("POST", "http://localhost/api/events", {
          title: "Weekly standup",
          start: "2024-06-01T10:00",
          end: "2024-06-01T10:30",
          recurrenceType: "weekly",
          recurrenceDays: ["MO", "WE"],
          recurrenceUntil: "2024-12-31",
        })
      );

      expect(mockInsertGoogleEvent).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({
          recurrenceData: expect.objectContaining({
            type: "weekly",
            days: ["MO", "WE"],
          }),
        })
      );
    });

    it("should return 500 when an error is thrown", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockInsertGoogleEvent.mockRejectedValue(new Error("Google API error"));

      const res = await POST(
        makeRequest("POST", "http://localhost/api/events", {
          title: "Test",
          start: "2024-06-01T10:00",
          end: "2024-06-01T11:00",
        })
      );

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ message: "Google API error" });
    });
  });

  // ── PUT ────────

  describe("PUT", () => {
    it("should return 401 when the user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const res = await PUT(makeRequest("PUT", "http://localhost/api/events"));

      expect(res.status).toBe(401);
    });

    it("should return 400 when no Google Calendar is linked", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockFetchAllGoogleEvents.mockResolvedValue(null);

      const res = await PUT(makeRequest("PUT", "http://localhost/api/events"));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "No Google Calendar linked" });
    });

    it("should return sync summary with correct counts", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      const googleEvents = [{ id: "g1" }, { id: "g2" }, { id: "g3" }];
      mockFetchAllGoogleEvents.mockResolvedValue(googleEvents);
      mockUpsertGoogleEvent
        .mockResolvedValueOnce("created")
        .mockResolvedValueOnce("updated")
        .mockResolvedValueOnce("skipped");

      const res = await PUT(makeRequest("PUT", "http://localhost/api/events"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({
        message: "Re-sync complete",
        created: 1,
        updated: 1,
        skipped: 1,
        total: 3,
      });
    });

    it("should return 500 when fetchAllGoogleEvents throws", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockFetchAllGoogleEvents.mockRejectedValue(new Error("Network error"));

      const res = await PUT(makeRequest("PUT", "http://localhost/api/events"));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ message: "Network error" });
    });
  });

  // ── PATCH ──────

  describe("PATCH", () => {
    it("should return 401 when the user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const res = await PATCH(
        makeRequest("PATCH", "http://localhost/api/events", { id: "aaaaaaaaaaaaaaaaaaaaaaaa" })
      );

      expect(res.status).toBe(401);
    });

    it("should return 404 when the event is not found", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.findFirst.mockResolvedValue(null);

      const res = await PATCH(
        makeRequest("PATCH", "http://localhost/api/events", {
          id: "aaaaaaaaaaaaaaaaaaaaaaaa",
        })
      );

      expect(res.status).toBe(404);
    });

    it("should call handleSeriesUpdate by default", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      const event = createMockEvent();
      mockPrismaEvent.findFirst.mockResolvedValue(event);
      mockHandleSeriesUpdate.mockResolvedValue(event);

      const res = await PATCH(
        makeRequest("PATCH", "http://localhost/api/events", {
          id: event.id,
          title: "Updated Title",
        })
      );

      expect(mockHandleSeriesUpdate).toHaveBeenCalled();
      expect(mockHandleSingleInstanceUpdate).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    it("should call handleSingleInstanceUpdate when mode=single and originalDate is provided", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      const event = createMockEvent();
      mockPrismaEvent.findFirst.mockResolvedValue(event);
      mockHandleSingleInstanceUpdate.mockResolvedValue(event);

      await PATCH(
        makeRequest("PATCH", "http://localhost/api/events", {
          id: event.id,
          mode: "single",
          originalDate: "2024-06-01",
        })
      );

      expect(mockHandleSingleInstanceUpdate).toHaveBeenCalled();
      expect(mockHandleSeriesUpdate).not.toHaveBeenCalled();
    });

    it("should calculate travel time when coords provided but travelDuration is not", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      const event = createMockEvent();
      mockPrismaEvent.findFirst.mockResolvedValue(event);
      mockHandleSeriesUpdate.mockResolvedValue(event);
      mockCalculateTravelTime.mockResolvedValue(30);

      await PATCH(
        makeRequest("PATCH", "http://localhost/api/events", {
          id: event.id,
          startCoords: [51.5, -0.1],
          destCoords: [51.6, -0.2],
          transportMode: "walking",
        })
      );

      expect(mockCalculateTravelTime).toHaveBeenCalledWith(
        [51.5, -0.1],
        [51.6, -0.2],
        "walking"
      );
    });

    it("should return 500 when an error is thrown", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.findFirst.mockRejectedValue(new Error("DB error"));

      const res = await PATCH(
        makeRequest("PATCH", "http://localhost/api/events", { id: "aaaaaaaaaaaaaaaaaaaaaaaa" })
      );

      expect(res.status).toBe(500);
    });
  });

  // ── DELETE ─────

  describe("DELETE", () => {
    it("should return 401 when the user is not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/events?id=aaaaaaaaaaaaaaaaaaaaaaaa")
      );

      expect(res.status).toBe(401);
    });

    it("should return 400 when the event ID is missing", async () => {
      mockGetServerSession.mockResolvedValue(createSession());

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/events")
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "Invalid event ID. Must be a MongoDB ObjectID" });
    });

    it("should return 400 when the event ID is not a valid ObjectId", async () => {
      mockGetServerSession.mockResolvedValue(createSession());

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/events?id=not-valid")
      );

      expect(res.status).toBe(400);
    });

    it("should return 404 when the event is not found", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.findFirst.mockResolvedValue(null);

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/events?id=aaaaaaaaaaaaaaaaaaaaaaaa")
      );

      expect(res.status).toBe(404);
    });

    it("should delete a single occurrence when mode=single and date is provided", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      const event = createMockEvent();
      mockPrismaEvent.findFirst.mockResolvedValue(event);
      mockDeleteSingleOccurrence.mockResolvedValue(null);

      const res = await DELETE(
        makeRequest(
          "DELETE",
          "http://localhost/api/events?id=aaaaaaaaaaaaaaaaaaaaaaaa&mode=single&date=2024-06-01"
        )
      );

      expect(mockDeleteSingleOccurrence).toHaveBeenCalledWith(
        "user-123",
        event.id,
        event.googleEventId,
        event.exceptions,
        "2024-06-01"
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true, message: "Occurrence removed" });
    });

    it("should return 400 when deleteSingleOccurrence returns an error", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.findFirst.mockResolvedValue(createMockEvent());
      mockDeleteSingleOccurrence.mockResolvedValue({ error: "Cannot delete" });

      const res = await DELETE(
        makeRequest(
          "DELETE",
          "http://localhost/api/events?id=aaaaaaaaaaaaaaaaaaaaaaaa&mode=single&date=2024-06-01"
        )
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "Cannot delete" });
    });

    it("should delete the full event and remove it from Google Calendar", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      const event = createMockEvent();
      mockPrismaEvent.findFirst.mockResolvedValue(event);
      mockDeleteGoogleEvent.mockResolvedValue(undefined);
      mockPrismaEvent.delete.mockResolvedValue(event);

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/events?id=aaaaaaaaaaaaaaaaaaaaaaaa")
      );

      expect(mockDeleteGoogleEvent).toHaveBeenCalledWith("user-123", event.googleEventId);
      expect(mockPrismaEvent.delete).toHaveBeenCalledWith({ where: { id: event.id } });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true, message: "Event deleted" });
    });

    it("should delete a local-only event without calling deleteGoogleEvent", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      const event = createMockEvent({ googleEventId: null });
      mockPrismaEvent.findFirst.mockResolvedValue(event);
      mockPrismaEvent.delete.mockResolvedValue(event);

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/events?id=aaaaaaaaaaaaaaaaaaaaaaaa")
      );

      expect(mockDeleteGoogleEvent).not.toHaveBeenCalled();
      expect(mockPrismaEvent.delete).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    it("should return 500 when an error is thrown during deletion", async () => {
      mockGetServerSession.mockResolvedValue(createSession());
      mockPrismaEvent.findFirst.mockRejectedValue(new Error("DB failure"));

      const res = await DELETE(
        makeRequest("DELETE", "http://localhost/api/events?id=aaaaaaaaaaaaaaaaaaaaaaaa")
      );

      expect(res.status).toBe(500);
    });
  });
});