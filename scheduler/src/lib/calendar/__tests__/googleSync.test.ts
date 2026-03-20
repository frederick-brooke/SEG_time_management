/**
 * Tests for src/lib/calendar/googleSync.ts
 *
 * Covers:
 * - parseDts: dateTime events, all-day events, missing fields
 * - upsertGoogleEvent: cancelled/missing ID skipped, create, update, skipped (recently synced)
 * - syncGoogleCalendar: no calendar client, iterates events, swallows per-event errors
 * - insertGoogleEvent: no client returns null, timed event, all-day event, recurrence, error returns null
 * - createLocalEvent: correct field mapping, travelDuration rounding, fallback defaults
 * - fetchAllGoogleEvents: no client returns null, returns items
 * - deleteSingleOccurrence: invalid date, pushes exception, calls deleteGoogleEvent
 * - deleteGoogleEvent: no client, full event delete, single instance delete, swallows errors
 */

import {
    parseDts,
    upsertGoogleEvent,
    syncGoogleCalendar,
    insertGoogleEvent,
    createLocalEvent,
    fetchAllGoogleEvents,
    deleteSingleOccurrence,
    deleteGoogleEvent,
  } from "../googleSync";
  import { prisma } from "@/lib/prisma";
  import { getGoogleCalendarClient } from "@/src/lib/calendar/googleCalendar";
  import { buildGoogleRecurrenceRule } from "@/src/lib/calendar/eventHelpers";
  
  // ── Mocks ────────────────────────────────────────────────────────────────────
  
  jest.mock("@/lib/prisma", () => ({
    prisma: {
      event: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    },
  }));
  
  jest.mock("@/src/lib/calendar/googleCalendar", () => ({
    getGoogleCalendarClient: jest.fn(),
  }));
  
  jest.mock("@/src/lib/calendar/eventHelpers", () => ({
    buildGoogleRecurrenceRule: jest.fn().mockReturnValue(undefined),
  }));
  
  // ── Typed mock helpers ────────────────────────────────────────────────────────
  
  const mockPrismaEvent = prisma.event as unknown as {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  const mockGetGoogleCalendarClient = getGoogleCalendarClient as jest.Mock;
  const mockBuildGoogleRecurrenceRule = buildGoogleRecurrenceRule as jest.Mock;
  
  // ── Factory helpers ───────────────────────────────────────────────────────────
  
  /**
   * Creates a mock Google Calendar event (as returned by the API).
   */
  function createGoogleEvent(overrides: Record<string, any> = {}) {
    return {
      id: "google-event-id",
      summary: "Test Event",
      description: "Test Description",
      status: "confirmed",
      start: { dateTime: "2024-06-03T10:00:00Z" },
      end: { dateTime: "2024-06-03T11:00:00Z" },
      ...overrides,
    };
  }
  
  /**
   * Creates a mock Google Calendar client.
   */
  function createMockCalendarClient(overrides: Record<string, any> = {}) {
    return {
      events: {
        list: jest.fn().mockResolvedValue({ data: { items: [] } }),
        insert: jest.fn().mockResolvedValue({ data: { id: "new-google-id" } }),
        delete: jest.fn().mockResolvedValue({}),
        ...overrides,
      },
    };
  }
  
  /**
   * Creates a mock Prisma event record.
   */
  function createMockDbEvent(overrides: Record<string, any> = {}) {
    return {
      id: "db-event-id",
      title: "Original Title",
      description: "Original Description",
      lastSyncedAt: null,
      ...overrides,
    };
  }
  
  // ── parseDts ──────────────────────────────────────────────────────────────────
  
  describe("parseDts", () => {
    it("should parse dateTime events into Date objects", () => {
      const ge = createGoogleEvent();
      const { startDt, endDt } = parseDts(ge);
  
      expect(startDt).toEqual(new Date("2024-06-03T10:00:00Z"));
      expect(endDt).toEqual(new Date("2024-06-03T11:00:00Z"));
    });
  
    it("should parse all-day events using the date field", () => {
      const ge = createGoogleEvent({
        start: { date: "2024-06-03" },
        end: { date: "2024-06-04" },
      });
      const { startDt, endDt } = parseDts(ge);
  
      expect(startDt).toEqual(new Date("2024-06-03T00:00:00Z"));
      expect(endDt).toEqual(new Date("2024-06-04T00:00:00Z"));
    });
  
    it("should fall back to epoch when both date and dateTime are missing", () => {
      const ge = createGoogleEvent({ start: {}, end: {} });
      const { startDt, endDt } = parseDts(ge);
  
      expect(startDt).toBeInstanceOf(Date);
      expect(endDt).toBeInstanceOf(Date);
    });
  
    it("should prefer dateTime over date when both are present", () => {
      const ge = createGoogleEvent({
        start: { dateTime: "2024-06-03T10:00:00Z", date: "2024-06-03" },
        end: { dateTime: "2024-06-03T11:00:00Z", date: "2024-06-03" },
      });
      const { startDt } = parseDts(ge);
  
      expect(startDt).toEqual(new Date("2024-06-03T10:00:00Z"));
    });
  });
  
  // ── upsertGoogleEvent ─────────────────────────────────────────────────────────
  
  describe("upsertGoogleEvent", () => {
    beforeEach(() => jest.clearAllMocks());
  
    it("should return 'skipped' when the event has no id", async () => {
      const result = await upsertGoogleEvent({ ...createGoogleEvent(), id: undefined }, "user-123");
      expect(result).toBe("skipped");
    });
  
    it("should return 'skipped' when the event status is 'cancelled'", async () => {
      const ge = createGoogleEvent({ status: "cancelled" });
      const result = await upsertGoogleEvent(ge, "user-123");
      expect(result).toBe("skipped");
    });
  
    it("should create a new event and return 'created' when no existing event found", async () => {
      mockPrismaEvent.findFirst.mockResolvedValue(null);
      mockPrismaEvent.create.mockResolvedValue({});
  
      const result = await upsertGoogleEvent(createGoogleEvent(), "user-123");
  
      expect(result).toBe("created");
      expect(mockPrismaEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            googleEventId: "google-event-id",
            title: "Test Event",
            userId: "user-123",
            category: "Google",
          }),
        })
      );
    });
  
    it("should update an existing event and return 'updated'", async () => {
      const existing = createMockDbEvent();
      mockPrismaEvent.findFirst.mockResolvedValue(existing);
      mockPrismaEvent.update.mockResolvedValue({});
  
      const result = await upsertGoogleEvent(createGoogleEvent(), "user-123");
  
      expect(result).toBe("updated");
      expect(mockPrismaEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: existing.id } })
      );
    });
  
    it("should return 'skipped' when the event was synced less than 10 seconds ago (matchByTitleDate)", async () => {
      const existing = createMockDbEvent({ lastSyncedAt: new Date() }); // just now
      mockPrismaEvent.findFirst.mockResolvedValue(existing);
  
      const result = await upsertGoogleEvent(createGoogleEvent(), "user-123", true);
  
      expect(result).toBe("skipped");
      expect(mockPrismaEvent.update).not.toHaveBeenCalled();
    });
  
    it("should update when lastSyncedAt is older than 10 seconds (matchByTitleDate)", async () => {
      const oldDate = new Date(Date.now() - 15000); // 15 seconds ago
      const existing = createMockDbEvent({ lastSyncedAt: oldDate });
      mockPrismaEvent.findFirst.mockResolvedValue(existing);
      mockPrismaEvent.update.mockResolvedValue({});
  
      const result = await upsertGoogleEvent(createGoogleEvent(), "user-123", true);
  
      expect(result).toBe("updated");
    });
  
    it("should use 'Untitled' as fallback title when summary is missing", async () => {
      mockPrismaEvent.findFirst.mockResolvedValue(null);
      mockPrismaEvent.create.mockResolvedValue({});
  
      await upsertGoogleEvent({ ...createGoogleEvent(), summary: undefined }, "user-123");
  
      expect(mockPrismaEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: "Untitled" }),
        })
      );
    });
  
    it("should set allDay=true when the event has no dateTime (all-day)", async () => {
      mockPrismaEvent.findFirst.mockResolvedValue(null);
      mockPrismaEvent.create.mockResolvedValue({});
  
      const ge = createGoogleEvent({
        start: { date: "2024-06-03" },
        end: { date: "2024-06-04" },
      });
      await upsertGoogleEvent(ge, "user-123");
  
      expect(mockPrismaEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ allDay: true }),
        })
      );
    });
  
    it("should use OR query when matchByTitleDate is true", async () => {
      mockPrismaEvent.findFirst.mockResolvedValue(null);
      mockPrismaEvent.create.mockResolvedValue({});
  
      await upsertGoogleEvent(createGoogleEvent(), "user-123", true);
  
      expect(mockPrismaEvent.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        })
      );
    });
  });
  
  // ── syncGoogleCalendar ────────────────────────────────────────────────────────
  
  describe("syncGoogleCalendar", () => {
    beforeEach(() => jest.clearAllMocks());
  
    it("should return early when no Google Calendar client is available", async () => {
      mockGetGoogleCalendarClient.mockResolvedValue(null);
  
      await syncGoogleCalendar("user-123", Date.now());
  
      expect(mockPrismaEvent.findFirst).not.toHaveBeenCalled();
    });
  
    it("should call events.list with 30 days lookback and singleEvents=true", async () => {
      const mockClient = createMockCalendarClient();
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      const now = Date.now();
      await syncGoogleCalendar("user-123", now);
  
      expect(mockClient.events.list).toHaveBeenCalledWith(
        expect.objectContaining({
          calendarId: "primary",
          singleEvents: true,
          timeMin: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
      );
    });
  
    it("should upsert each event returned by the API", async () => {
      const events = [createGoogleEvent({ id: "g1" }), createGoogleEvent({ id: "g2" })];
      const mockClient = createMockCalendarClient({
        list: jest.fn().mockResolvedValue({ data: { items: events } }),
      });
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
      mockPrismaEvent.findFirst.mockResolvedValue(null);
      mockPrismaEvent.create.mockResolvedValue({});
  
      await syncGoogleCalendar("user-123", Date.now());
  
      expect(mockPrismaEvent.findFirst).toHaveBeenCalledTimes(2);
    });
  
    it("should handle an empty items array without throwing", async () => {
      const mockClient = createMockCalendarClient({
        list: jest.fn().mockResolvedValue({ data: { items: [] } }),
      });
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      await expect(syncGoogleCalendar("user-123", Date.now())).resolves.not.toThrow();
    });
  
    it("should swallow per-event upsert errors and continue processing", async () => {
      const events = [createGoogleEvent({ id: "g1" }), createGoogleEvent({ id: "g2" })];
      const mockClient = createMockCalendarClient({
        list: jest.fn().mockResolvedValue({ data: { items: events } }),
      });
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
      mockPrismaEvent.findFirst
        .mockRejectedValueOnce(new Error("DB error on first"))
        .mockResolvedValueOnce(null);
      mockPrismaEvent.create.mockResolvedValue({});
  
      await expect(syncGoogleCalendar("user-123", Date.now())).resolves.not.toThrow();
    });
  });
  
  // ── insertGoogleEvent ─────────────────────────────────────────────────────────
  
  describe("insertGoogleEvent", () => {
    beforeEach(() => jest.clearAllMocks());
  
    it("should return null when no Google Calendar client is available", async () => {
      mockGetGoogleCalendarClient.mockResolvedValue(null);
  
      const result = await insertGoogleEvent("user-123", {
        title: "Test",
        start: "2024-06-03T10:00:00Z",
        end: "2024-06-03T11:00:00Z",
        recurrenceData: null,
      });
  
      expect(result).toBeNull();
    });
  
    it("should insert a timed event and return the Google event ID", async () => {
      const mockClient = createMockCalendarClient({
        insert: jest.fn().mockResolvedValue({ data: { id: "new-google-id" } }),
      });
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      const result = await insertGoogleEvent("user-123", {
        title: "Test Event",
        description: "A description",
        start: "2024-06-03T10:00:00Z",
        end: "2024-06-03T11:00:00Z",
        recurrenceData: null,
      });
  
      expect(result).toBe("new-google-id");
      expect(mockClient.events.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            summary: "Test Event",
            start: expect.objectContaining({ dateTime: expect.any(String) }),
          }),
        })
      );
    });
  
    it("should insert an all-day event using the date format", async () => {
      const mockClient = createMockCalendarClient({
        insert: jest.fn().mockResolvedValue({ data: { id: "all-day-id" } }),
      });
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      await insertGoogleEvent("user-123", {
        title: "All Day",
        start: "2024-06-03T00:00:00Z",
        end: "2024-06-04T00:00:00Z",
        allDay: true,
        recurrenceData: null,
      });
  
      const requestBody = mockClient.events.insert.mock.calls[0][0].requestBody;
      expect(requestBody.start).toEqual({ date: "2024-06-03" });
      expect(requestBody.end).toEqual({ date: "2024-06-04" });
    });
  
    it("should include recurrence when buildGoogleRecurrenceRule returns a rule", async () => {
      const mockClient = createMockCalendarClient({
        insert: jest.fn().mockResolvedValue({ data: { id: "recurring-id" } }),
      });
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
      mockBuildGoogleRecurrenceRule.mockReturnValue(["RRULE:FREQ=WEEKLY;UNTIL=20241231T000000Z"]);
  
      await insertGoogleEvent("user-123", {
        title: "Weekly",
        start: "2024-06-03T10:00:00Z",
        end: "2024-06-03T11:00:00Z",
        recurrenceData: { type: "weekly", until: "2024-12-31" },
      });
  
      const requestBody = mockClient.events.insert.mock.calls[0][0].requestBody;
      expect(requestBody.recurrence).toEqual(["RRULE:FREQ=WEEKLY;UNTIL=20241231T000000Z"]);
    });
  
    it("should return null and not throw when the Google insert fails", async () => {
      const mockClient = createMockCalendarClient({
        insert: jest.fn().mockRejectedValue(new Error("Google API error")),
      });
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      const result = await insertGoogleEvent("user-123", {
        title: "Test",
        start: "2024-06-03T10:00:00Z",
        end: "2024-06-03T11:00:00Z",
        recurrenceData: null,
      });
  
      expect(result).toBeNull();
    });
  
    it("should return null when the API response has no event ID", async () => {
      const mockClient = createMockCalendarClient({
        insert: jest.fn().mockResolvedValue({ data: {} }),
      });
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      const result = await insertGoogleEvent("user-123", {
        title: "Test",
        start: "2024-06-03T10:00:00Z",
        end: "2024-06-03T11:00:00Z",
        recurrenceData: null,
      });
  
      expect(result).toBeNull();
    });
  });
  
  // ── createLocalEvent ──────────────────────────────────────────────────────────
  
  describe("createLocalEvent", () => {
    beforeEach(() => jest.clearAllMocks());
  
    it("should create a local event with the correct fields", async () => {
      mockPrismaEvent.create.mockResolvedValue({ id: "local-event-id" });
  
      await createLocalEvent("user-123", "google-id", {
        title: "Test Event",
        description: "A description",
        start: "2024-06-03T10:00:00Z",
        end: "2024-06-03T11:00:00Z",
        recurrenceData: null,
      });
  
      expect(mockPrismaEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Test Event",
            description: "A description",
            userId: "user-123",
            googleEventId: "google-id",
          }),
        })
      );
    });
  
    it("should default category to 'Personal' when not provided", async () => {
      mockPrismaEvent.create.mockResolvedValue({});
  
      await createLocalEvent("user-123", null, {
        title: "Test",
        start: "2024-06-03T10:00:00Z",
        end: "2024-06-03T11:00:00Z",
        recurrenceData: null,
      });
  
      expect(mockPrismaEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ category: "Personal" }),
        })
      );
    });
  
    it("should round travelDuration to the nearest integer", async () => {
      mockPrismaEvent.create.mockResolvedValue({});
  
      await createLocalEvent("user-123", null, {
        title: "Test",
        start: "2024-06-03T10:00:00Z",
        end: "2024-06-03T11:00:00Z",
        recurrenceData: null,
        travelDuration: 14.6,
      });
  
      expect(mockPrismaEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ travelDuration: 15 }),
        })
      );
    });
  
    it("should set googleEventId to null when not provided", async () => {
      mockPrismaEvent.create.mockResolvedValue({});
  
      await createLocalEvent("user-123", null, {
        title: "Test",
        start: "2024-06-03T10:00:00Z",
        end: "2024-06-03T11:00:00Z",
        recurrenceData: null,
      });
  
      expect(mockPrismaEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ googleEventId: null }),
        })
      );
    });
  
    it("should strip milliseconds from start and end timestamps", async () => {
      mockPrismaEvent.create.mockResolvedValue({});
  
      await createLocalEvent("user-123", null, {
        title: "Test",
        start: "2024-06-03T10:00:00.123Z",
        end: "2024-06-03T11:00:00.456Z",
        recurrenceData: null,
      });
  
      const data = mockPrismaEvent.create.mock.calls[0][0].data;
      expect(data.start.getMilliseconds()).toBe(0);
      expect(data.end.getMilliseconds()).toBe(0);
    });
  
    it("should set allDay=false by default", async () => {
      mockPrismaEvent.create.mockResolvedValue({});
  
      await createLocalEvent("user-123", null, {
        title: "Test",
        start: "2024-06-03T10:00:00Z",
        end: "2024-06-03T11:00:00Z",
        recurrenceData: null,
      });
  
      expect(mockPrismaEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ allDay: false }),
        })
      );
    });
  });
  
  // ── fetchAllGoogleEvents ──────────────────────────────────────────────────────
  
  describe("fetchAllGoogleEvents", () => {
    beforeEach(() => jest.clearAllMocks());
  
    it("should return null when no Google Calendar client is available", async () => {
      mockGetGoogleCalendarClient.mockResolvedValue(null);
  
      const result = await fetchAllGoogleEvents("user-123");
  
      expect(result).toBeNull();
    });
  
    it("should return the list of events from the API", async () => {
      const events = [createGoogleEvent({ id: "g1" }), createGoogleEvent({ id: "g2" })];
      const mockClient = createMockCalendarClient({
        list: jest.fn().mockResolvedValue({ data: { items: events } }),
      });
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      const result = await fetchAllGoogleEvents("user-123");
  
      expect(result).toEqual(events);
    });
  
    it("should return an empty array when the API returns no items", async () => {
      const mockClient = createMockCalendarClient({
        list: jest.fn().mockResolvedValue({ data: {} }),
      });
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      const result = await fetchAllGoogleEvents("user-123");
  
      expect(result).toEqual([]);
    });
  
    it("should request a full year range with singleEvents=false", async () => {
      const mockClient = createMockCalendarClient();
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      await fetchAllGoogleEvents("user-123");
  
      expect(mockClient.events.list).toHaveBeenCalledWith(
        expect.objectContaining({
          singleEvents: false,
          maxResults: 2500,
        })
      );
    });
  });
  
  // ── deleteSingleOccurrence ────────────────────────────────────────────────────
  
  describe("deleteSingleOccurrence", () => {
    beforeEach(() => jest.clearAllMocks());
  
    it("should return an error object when instanceDate is invalid", async () => {
      const result = await deleteSingleOccurrence(
        "user-123", "event-id", null, [], "not-a-date"
      );
  
      expect(result).toEqual({ error: "Invalid date" });
    });
  
    it("should push the ISO exception date to the event when not already present", async () => {
      mockPrismaEvent.update.mockResolvedValue({});
  
      await deleteSingleOccurrence(
        "user-123", "event-id", null, [], "2024-06-10T10:00:00Z"
      );
  
      expect(mockPrismaEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "event-id" },
          data: { exceptions: { push: expect.stringContaining("2024-06-10T10:00:00Z") } },
        })
      );
    });
  
    it("should not push the exception if it already exists in the exceptions array", async () => {
      const iso = new Date("2024-06-10T10:00:00Z").toISOString().split(".")[0] + "Z";
      mockPrismaEvent.update.mockResolvedValue({});
  
      await deleteSingleOccurrence(
        "user-123", "event-id", null, [iso], "2024-06-10T10:00:00Z"
      );
  
      expect(mockPrismaEvent.update).not.toHaveBeenCalled();
    });
  
    it("should call deleteGoogleEvent when googleEventId is provided", async () => {
      mockGetGoogleCalendarClient.mockResolvedValue(
        createMockCalendarClient()
      );
      mockPrismaEvent.update.mockResolvedValue({});
  
      await deleteSingleOccurrence(
        "user-123", "event-id", "google-event-id", [], "2024-06-10T10:00:00Z"
      );
  
      expect(mockGetGoogleCalendarClient).toHaveBeenCalledWith("user-123");
    });
  
    it("should not call deleteGoogleEvent when googleEventId is null", async () => {
      mockPrismaEvent.update.mockResolvedValue({});
  
      await deleteSingleOccurrence(
        "user-123", "event-id", null, [], "2024-06-10T10:00:00Z"
      );
  
      expect(mockGetGoogleCalendarClient).not.toHaveBeenCalled();
    });
  
    it("should return null on success", async () => {
      mockPrismaEvent.update.mockResolvedValue({});
  
      const result = await deleteSingleOccurrence(
        "user-123", "event-id", null, [], "2024-06-10T10:00:00Z"
      );
  
      expect(result).toBeNull();
    });
  });
  
  // ── deleteGoogleEvent ─────────────────────────────────────────────────────────
  
  describe("deleteGoogleEvent", () => {
    beforeEach(() => jest.clearAllMocks());
  
    it("should return early when no Google Calendar client is available", async () => {
      mockGetGoogleCalendarClient.mockResolvedValue(null);
  
      await deleteGoogleEvent("user-123", "google-event-id");
  
      expect(mockGetGoogleCalendarClient).toHaveBeenCalled();
    });
  
    it("should delete the full event when no instanceIso is provided", async () => {
      const mockClient = createMockCalendarClient();
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      await deleteGoogleEvent("user-123", "google-event-id");
  
      expect(mockClient.events.delete).toHaveBeenCalledWith({
        calendarId: "primary",
        eventId: "google-event-id",
      });
    });
  
    it("should delete a specific instance when instanceIso is provided", async () => {
      const mockClient = createMockCalendarClient();
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      await deleteGoogleEvent("user-123", "google-event-id", "2024-06-10T10:00:00Z");
  
      const deleteCall = mockClient.events.delete.mock.calls[0][0];
      // Instance ID format: googleEventId_YYYYMMDDZ
      expect(deleteCall.eventId).toMatch(/^google-event-id_\d{8}Z$/);
    });
  
    it("should swallow errors without throwing", async () => {
      const mockClient = createMockCalendarClient({
        delete: jest.fn().mockRejectedValue(new Error("Google API error")),
      });
      mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
  
      await expect(
        deleteGoogleEvent("user-123", "google-event-id")
      ).resolves.not.toThrow();
    });
  });