/**
 * Tests for src/lib/calendar/eventMutations.ts
 */

import { handleSingleInstanceUpdate, handleSeriesUpdate } from "../eventMutations";
import { prisma } from "@/lib/prisma";
import { getGoogleCalendarClient } from "@/src/lib/calendar/googleCalendar";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("@/src/lib/calendar/googleCalendar", () => ({
  getGoogleCalendarClient: jest.fn(),
}));

// ── Typed mock helpers ────────────────────────────────────────────────────────

const mockPrismaEvent = prisma.event as unknown as {
  update: jest.Mock;
  create: jest.Mock;
};
const mockGetGoogleCalendarClient = getGoogleCalendarClient as jest.Mock;

// ── Factory helpers ───────────────────────────────────────────────────────────

/**
 * Creates a mock Google Calendar client with a patchable events.patch method.
 */
function createMockGoogleClient(patchImpl?: () => Promise<any>) {
  return {
    events: {
      patch: jest.fn().mockImplementation(
        patchImpl ?? (() => Promise.resolve({ data: { id: "google-instance-id" } }))
      ),
    },
  };
}

/**
 * Creates a mock Prisma event as returned from the DB.
 */
function createMockEvent(overrides: Record<string, any> = {}) {
  return {
    id: "event-db-id",
    title: "Original Title",
    description: "Original Description",
    start: new Date("2024-06-03T09:00:00Z"),
    end: new Date("2024-06-03T10:00:00Z"),
    userId: "user-123",
    googleEventId: "google-event-id",
    category: "Lecture",
    allDay: false,
    exceptions: [],
    startCoords: null,
    destinationCoords: null,
    travelDuration: null,
    transportMode: null,
    startLocationName: null,
    destLocationName: null,
    ...overrides,
  };
}

/**
 * Creates a minimal request body for a single instance update.
 */
function createSingleInstanceBody(overrides: Record<string, any> = {}) {
  return {
    originalDate: "2024-06-10T09:00:00Z",
    start: "2024-06-10T09:00:00Z",
    end: "2024-06-10T10:00:00Z",
    title: "Updated Title",
    description: "Updated Description",
    ...overrides,
  };
}

/**
 * Creates a minimal request body for a series update.
 */
function createSeriesBody(overrides: Record<string, any> = {}) {
  return {
    id: "event-db-id",
    start: "2024-06-03T11:00:00Z",
    end: "2024-06-03T12:00:00Z",
    title: "New Series Title",
    description: "New Series Description",
    startCoords: null,
    destCoords: null,
    startLocationName: null,
    destLocationName: null,
    transportMode: null,
    travelDuration: null,
    ...overrides,
  };
}

// ── handleSingleInstanceUpdate ────────────────────────────────────────────────

describe("handleSingleInstanceUpdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Exception pushing ───────────────────────────────────────────────────────

  it("should push the originalDate ISO string to the event exceptions", async () => {
    const event = createMockEvent();
    const body = createSingleInstanceBody();
    const mockClient = createMockGoogleClient();
    mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
    mockPrismaEvent.update.mockResolvedValue({ ...event, exceptions: [new Date(body.originalDate).toISOString()] });
    mockPrismaEvent.create.mockResolvedValue({});

    await handleSingleInstanceUpdate(event, body, "user-123");

    expect(mockPrismaEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: event.id },
        data: { exceptions: { push: new Date(body.originalDate).toISOString() } },
      })
    );
  });

  // ── Exception event creation ────────────────────────────────────────────────

  it("should create a new exception event with the updated fields", async () => {
    const event = createMockEvent();
    const body = createSingleInstanceBody({ title: "Exception Title" });
    const mockClient = createMockGoogleClient();
    mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
    mockPrismaEvent.update.mockResolvedValue({});
    mockPrismaEvent.create.mockResolvedValue({ id: "new-exception-event" });

    await handleSingleInstanceUpdate(event, body, "user-123");

    expect(mockPrismaEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Exception Title",
          start: new Date(body.start),
          end: new Date(body.end),
          userId: "user-123",
          category: event.category,
        }),
      })
    );
  });

  it("should fall back to the original event title when body title is not provided", async () => {
    const event = createMockEvent({ title: "Original Title" });
    const body = createSingleInstanceBody({ title: undefined });
    const mockClient = createMockGoogleClient();
    mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
    mockPrismaEvent.update.mockResolvedValue({});
    mockPrismaEvent.create.mockResolvedValue({});

    await handleSingleInstanceUpdate(event, body, "user-123");

    expect(mockPrismaEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: "Original Title" }),
      })
    );
  });

  it("should round travelDuration to the nearest integer", async () => {
    const event = createMockEvent();
    const body = createSingleInstanceBody({ travelDuration: 12.7 });
    const mockClient = createMockGoogleClient();
    mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
    mockPrismaEvent.update.mockResolvedValue({});
    mockPrismaEvent.create.mockResolvedValue({});

    await handleSingleInstanceUpdate(event, body, "user-123");

    expect(mockPrismaEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ travelDuration: 13 }),
      })
    );
  });

  it("should use event travelDuration as fallback when body does not provide one", async () => {
    const event = createMockEvent({ travelDuration: 20 });
    const body = createSingleInstanceBody({ travelDuration: undefined });
    const mockClient = createMockGoogleClient();
    mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
    mockPrismaEvent.update.mockResolvedValue({});
    mockPrismaEvent.create.mockResolvedValue({});

    await handleSingleInstanceUpdate(event, body, "user-123");

    expect(mockPrismaEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ travelDuration: 20 }),
      })
    );
  });

  // ── Google patching ─────────────────────────────────────────────────────────

  it("should patch the Google Calendar instance when googleEventId exists", async () => {
    const event = createMockEvent({ googleEventId: "google-event-id" });
    const body = createSingleInstanceBody();
    const mockClient = createMockGoogleClient();
    mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
    mockPrismaEvent.update.mockResolvedValue({});
    mockPrismaEvent.create.mockResolvedValue({});

    await handleSingleInstanceUpdate(event, body, "user-123");

    expect(mockClient.events.patch).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: "primary",
        eventId: expect.stringContaining("google-event-id"),
      })
    );
  });

  it("should not call Google Calendar when googleEventId is null", async () => {
    const event = createMockEvent({ googleEventId: null });
    const body = createSingleInstanceBody();
    mockPrismaEvent.update.mockResolvedValue({});
    mockPrismaEvent.create.mockResolvedValue({});

    await handleSingleInstanceUpdate(event, body, "user-123");

    expect(mockGetGoogleCalendarClient).not.toHaveBeenCalled();
  });

  it("should create the exception event with null googleEventId when Google client is unavailable", async () => {
    const event = createMockEvent();
    const body = createSingleInstanceBody();
    mockGetGoogleCalendarClient.mockResolvedValue(null);
    mockPrismaEvent.update.mockResolvedValue({});
    mockPrismaEvent.create.mockResolvedValue({});

    await handleSingleInstanceUpdate(event, body, "user-123");

    expect(mockPrismaEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ googleEventId: null }),
      })
    );
  });

  it("should still create the exception event when the Google patch throws", async () => {
    const event = createMockEvent();
    const body = createSingleInstanceBody();
    const mockClient = createMockGoogleClient(() => Promise.reject(new Error("Google error")));
    mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
    mockPrismaEvent.update.mockResolvedValue({});
    mockPrismaEvent.create.mockResolvedValue({ id: "fallback-event" });

    await handleSingleInstanceUpdate(event, body, "user-123");

    // Exception event should still be created despite Google failure
    expect(mockPrismaEvent.create).toHaveBeenCalled();
  });

  it("should return the newly created exception event", async () => {
    const event = createMockEvent();
    const body = createSingleInstanceBody();
    const createdEvent = { id: "new-exception-id", title: "Exception Title" };
    const mockClient = createMockGoogleClient();
    mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
    mockPrismaEvent.update.mockResolvedValue({});
    mockPrismaEvent.create.mockResolvedValue(createdEvent);

    const result = await handleSingleInstanceUpdate(event, body, "user-123");

    expect(result).toEqual(createdEvent);
  });

  // ── Google instance ID format ───────────────────────────────────────────────

  it("should format the Google instance ID by stripping dashes and colons from the date", async () => {
    const event = createMockEvent({ googleEventId: "google-event-id" });
    const body = createSingleInstanceBody({ originalDate: "2024-06-10T09:00:00Z" });
    const mockClient = createMockGoogleClient();
    mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
    mockPrismaEvent.update.mockResolvedValue({});
    mockPrismaEvent.create.mockResolvedValue({});

    await handleSingleInstanceUpdate(event, body, "user-123");

    const callArgs = mockClient.events.patch.mock.calls[0][0];

    expect(callArgs.eventId).toBe("google-event-id_20240610T090000Z");
  });
});

// ── handleSeriesUpdate ────────────────────────────────────────────────────────

describe("handleSeriesUpdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Time calculation ────────────────────────────────────────────────────────

  it("should preserve the original date and apply the new time-of-day from the body", async () => {
    const event = createMockEvent({
      start: new Date("2024-06-03T09:00:00Z"),
    });
    const body = createSeriesBody({
      start: "2024-06-03T11:00:00Z", // new time: 11:00
      end: "2024-06-03T12:00:00Z",
    });
    const updatedEvent = { ...createMockEvent(), start: new Date("2024-06-03T11:00:00Z") };
    mockPrismaEvent.update.mockResolvedValue(updatedEvent);

    await handleSeriesUpdate(event, body, "user-123");

    const updateCall = mockPrismaEvent.update.mock.calls[0][0];
    expect(updateCall.data.start.getHours()).toBe(new Date("2024-06-03T11:00:00Z").getHours());
  });

  it("should calculate duration from body start/end and apply to the series end time", async () => {
    const event = createMockEvent({
      start: new Date("2024-06-03T09:00:00Z"),
    });
    // 2 hour duration
    const body = createSeriesBody({
      start: "2024-06-03T11:00:00Z",
      end: "2024-06-03T13:00:00Z",
    });
    mockPrismaEvent.update.mockResolvedValue(createMockEvent());

    await handleSeriesUpdate(event, body, "user-123");

    const updateCall = mockPrismaEvent.update.mock.calls[0][0];
    const duration = updateCall.data.end.getTime() - updateCall.data.start.getTime();
    expect(duration).toBe(2 * 60 * 60 * 1000); // 2 hours in ms
  });

  // ── Prisma update ───────────────────────────────────────────────────────────

  it("should call prisma.event.update with the correct event ID", async () => {
    const event = createMockEvent();
    const body = createSeriesBody({ id: "event-db-id" });
    mockPrismaEvent.update.mockResolvedValue(createMockEvent());

    await handleSeriesUpdate(event, body, "user-123");

    expect(mockPrismaEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "event-db-id" } })
    );
  });

  it("should update title and description when provided", async () => {
    const event = createMockEvent();
    const body = createSeriesBody({ title: "New Title", description: "New Desc" });
    mockPrismaEvent.update.mockResolvedValue(createMockEvent());

    await handleSeriesUpdate(event, body, "user-123");

    expect(mockPrismaEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "New Title",
          description: "New Desc",
        }),
      })
    );
  });

  it("should set title to undefined when body title is not provided", async () => {
    const event = createMockEvent();
    const body = createSeriesBody({ title: undefined });
    mockPrismaEvent.update.mockResolvedValue(createMockEvent());

    await handleSeriesUpdate(event, body, "user-123");

    expect(mockPrismaEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: undefined }),
      })
    );
  });

  it("should round travelDuration to the nearest integer", async () => {
    const event = createMockEvent();
    const body = createSeriesBody({ travelDuration: 15.9 });
    mockPrismaEvent.update.mockResolvedValue(createMockEvent());

    await handleSeriesUpdate(event, body, "user-123");

    expect(mockPrismaEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ travelDuration: 16 }),
      })
    );
  });

  it("should set travelDuration to null when not provided", async () => {
    const event = createMockEvent();
    const body = createSeriesBody({ travelDuration: null });
    mockPrismaEvent.update.mockResolvedValue(createMockEvent());

    await handleSeriesUpdate(event, body, "user-123");

    expect(mockPrismaEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ travelDuration: null }),
      })
    );
  });

  it("should set startCoords to null when not provided", async () => {
    const event = createMockEvent();
    const body = createSeriesBody({ startCoords: undefined });
    mockPrismaEvent.update.mockResolvedValue(createMockEvent());

    await handleSeriesUpdate(event, body, "user-123");

    expect(mockPrismaEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ startCoords: null }),
      })
    );
  });

  // ── Return value ────────────────────────────────────────────────────────────

  it("should return the updated event from Prisma", async () => {
    const event = createMockEvent();
    const body = createSeriesBody();
    const updatedEvent = { ...createMockEvent(), title: "New Series Title" };
    mockPrismaEvent.update.mockResolvedValue(updatedEvent);

    const result = await handleSeriesUpdate(event, body, "user-123");

    expect(result).toEqual(updatedEvent);
  });

  // ── Google fire-and-forget ──────────────────────────────────────────────────

  it("should fire-and-forget the Google patch without awaiting it", async () => {
    const event = createMockEvent({ googleEventId: "google-event-id" });
    const body = createSeriesBody();
    const mockClient = createMockGoogleClient();
    mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
    mockPrismaEvent.update.mockResolvedValue(createMockEvent());

    // Should resolve without waiting for Google
    const result = await handleSeriesUpdate(event, body, "user-123");

    // Result is returned immediately — Google may still be pending
    expect(result).toBeDefined();
  });

  it("should not throw when the Google series patch fails", async () => {
    const event = createMockEvent({ googleEventId: "google-event-id" });
    const body = createSeriesBody();
    const mockClient = createMockGoogleClient(() => Promise.reject(new Error("Google error")));
    mockGetGoogleCalendarClient.mockResolvedValue(mockClient);
    mockPrismaEvent.update.mockResolvedValue(createMockEvent());

    // Fire-and-forget — error is swallowed internally
    await expect(handleSeriesUpdate(event, body, "user-123")).resolves.not.toThrow();
  });

  it("should skip the Google patch when googleEventId is null", async () => {
    const event = createMockEvent({ googleEventId: null });
    const body = createSeriesBody();
    mockPrismaEvent.update.mockResolvedValue({ ...createMockEvent(), googleEventId: null });

    await handleSeriesUpdate(event, body, "user-123");

    // Allow the fire-and-forget to settle
    await new Promise((r) => setTimeout(r, 10));

    expect(mockGetGoogleCalendarClient).not.toHaveBeenCalled();
  });
});