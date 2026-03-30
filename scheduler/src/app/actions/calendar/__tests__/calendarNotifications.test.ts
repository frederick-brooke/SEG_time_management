/**
 * Testing for calendar notifications actions.
 */
import {
    checkUpcomingEventNotifications,
    resetEventNotificationGuards,
    deleteEventNotifications,
  } from "../calendarNotifications";
  

// Mocks

const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockDeleteMany = jest.fn();

jest.mock("@/lib/prisma", () => ({
prisma: {
    event: {
    findMany: (...args: any[]) => mockFindMany(...args),
    update: (...args: any[]) => mockUpdate(...args),
    },
    notification: {
    deleteMany: (...args: any[]) => mockDeleteMany(...args),
    },
},
}));

const mockCreateNotification = jest.fn();
jest.mock("../../notifications", () => ({
createNotification: (...args: any[]) => mockCreateNotification(...args),
}));

jest.mock("@prisma/client", () => ({
NotificationType: { WARNING: "WARNING", INFO: "INFO" },
}));

// Helpers

const NOW = new Date("2026-03-23T10:00:00.000Z");

function makeEvent(overrides: Partial<any> = {}) {
return {
    id: "event-1",
    title: "Test Event",
    allDay: false,
    start: new Date(NOW.getTime() + 3 * 60_000), // 3 mins from now
    travelDuration: null,
    travelNotifiedAt: null,
    eventNotifiedAt: null,
    destLocationName: null,
    ...overrides,
};
}

// Tests

describe("checkUpcomingEventNotifications", () => {
beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
});

afterEach(() => {
    jest.useRealTimers();
});

it("returns error when userId is empty", async () => {
    const result = await checkUpcomingEventNotifications("");
    expect(result).toEqual({ success: false, error: "No userId" });
    expect(mockFindMany).not.toHaveBeenCalled();
});

it("returns success when no upcoming events found", async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await checkUpcomingEventNotifications("user-1");
    expect(result).toEqual({ success: true });
    expect(mockCreateNotification).not.toHaveBeenCalled();
});

it("sends event reminder when event starts within 5 mins and not yet notified", async () => {
    mockFindMany.mockResolvedValue([makeEvent()]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).toHaveBeenCalledWith(
    "user-1",
    "Event Starting Soon",
    expect.stringContaining("Test Event"),
    "INFO",
    );
});

it("updates eventNotifiedAt after sending event reminder", async () => {
    mockFindMany.mockResolvedValue([makeEvent()]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
        where: { id: "event-1" },
        data: expect.objectContaining({ eventNotifiedAt: NOW }),
    }),
    );
});

it("does not send event reminder when already notified", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({ eventNotifiedAt: new Date(NOW.getTime() - 60_000) }),
    ]);

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).not.toHaveBeenCalledWith(
    expect.any(String),
    "Event Starting Soon",
    expect.any(String),
    expect.any(String),
    );
});

it("does not send event reminder when event starts in more than 5 mins", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({ start: new Date(NOW.getTime() + 10 * 60_000) }),
    ]);

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).not.toHaveBeenCalled();
});

it("does not send event reminder when event has already started (minsUntil <= 0)", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({ start: new Date(NOW.getTime() - 60_000) }),
    ]);

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).not.toHaveBeenCalled();
});

it("includes singular 'minute' when 1 minute until event", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({ start: new Date(NOW.getTime() + 1 * 60_000) }),
    ]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).toHaveBeenCalledWith(
    expect.any(String),
    "Event Starting Soon",
    expect.stringContaining("1 minute"),
    "INFO",
    );
});

it("includes plural 'minutes' when multiple minutes until event", async () => {
    mockFindMany.mockResolvedValue([makeEvent()]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).toHaveBeenCalledWith(
    expect.any(String),
    "Event Starting Soon",
    expect.stringContaining("minutes"),
    "INFO",
    );
});

it("sends travel notification when within travel window and not yet notified", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({
        start: new Date(NOW.getTime() + 20 * 60_000),
        travelDuration: 25,
    }),
    ]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).toHaveBeenCalledWith(
    "user-1",
    "Time to Leave",
    expect.stringContaining("Test Event"),
    "WARNING",
    );
});

it("updates travelNotifiedAt after sending travel notification", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({
        start: new Date(NOW.getTime() + 20 * 60_000),
        travelDuration: 25,
    }),
    ]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
        where: { id: "event-1" },
        data: expect.objectContaining({ travelNotifiedAt: NOW }),
    }),
    );
});

it("does not send travel notification when already notified", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({
        start: new Date(NOW.getTime() + 20 * 60_000),
        travelDuration: 25,
        travelNotifiedAt: new Date(NOW.getTime() - 60_000),
    }),
    ]);

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).not.toHaveBeenCalledWith(
    expect.any(String),
    "Time to Leave",
    expect.any(String),
    expect.any(String),
    );
});

it("does not send travel notification when outside travel window", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({
        start: new Date(NOW.getTime() + 60 * 60_000), // 60 mins away
        travelDuration: 25,
    }),
    ]);

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).not.toHaveBeenCalledWith(
    expect.any(String),
    "Time to Leave",
    expect.any(String),
    expect.any(String),
    );
});

it("does not send travel notification when travelDuration is null", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({ travelDuration: null }),
    ]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).not.toHaveBeenCalledWith(
    expect.any(String),
    "Time to Leave",
    expect.any(String),
    expect.any(String),
    );
});

it("does not send travel notification when travelDuration is 0", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({ travelDuration: 0 }),
    ]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).not.toHaveBeenCalledWith(
    expect.any(String),
    "Time to Leave",
    expect.any(String),
    expect.any(String),
    );
});

it("uses destLocationName in travel notification when present", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({
        start: new Date(NOW.getTime() + 20 * 60_000),
        travelDuration: 25,
        destLocationName: "Main Campus",
    }),
    ]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).toHaveBeenCalledWith(
    expect.any(String),
    "Time to Leave",
    expect.stringContaining("Main Campus"),
    "WARNING",
    );
});

it("falls back to event title as destination when destLocationName is null", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({
        start: new Date(NOW.getTime() + 20 * 60_000),
        travelDuration: 25,
        destLocationName: null,
    }),
    ]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).toHaveBeenCalledWith(
    expect.any(String),
    "Time to Leave",
    expect.stringContaining("Test Event"),
    "WARNING",
    );
});

it("formats travel duration in minutes when under 60", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({
        start: new Date(NOW.getTime() + 20 * 60_000),
        travelDuration: 25,
    }),
    ]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    expect(mockCreateNotification).toHaveBeenCalledWith(
    expect.any(String),
    "Time to Leave",
    expect.stringContaining("25 min"),
    "WARNING",
    );
});

it("can send both travel and event reminder notifications for the same event", async () => {
    mockFindMany.mockResolvedValue([
    makeEvent({
        start: new Date(NOW.getTime() + 3 * 60_000),
        travelDuration: 5,
    }),
    ]);
    mockUpdate.mockResolvedValue({});
    mockCreateNotification.mockResolvedValue({});

    await checkUpcomingEventNotifications("user-1");

    const calls = mockCreateNotification.mock.calls.map((c) => c[1]);
    expect(calls).toContain("Time to Leave");
    expect(calls).toContain("Event Starting Soon");
});

it("returns failure when prisma throws", async () => {
    mockFindMany.mockRejectedValue(new Error("DB error"));

    const result = await checkUpcomingEventNotifications("user-1");

    expect(result).toEqual({
    success: false,
    error: "Failed to check event notifications",
    });
});
});


describe("resetEventNotificationGuards", () => {
beforeEach(() => jest.clearAllMocks());

it("updates travelNotifiedAt and eventNotifiedAt to null", async () => {
    mockUpdate.mockResolvedValue({});

    const result = await resetEventNotificationGuards("event-1");

    expect(mockUpdate).toHaveBeenCalledWith({
    where: { id: "event-1" },
    data: { travelNotifiedAt: null, eventNotifiedAt: null },
    });
    expect(result).toEqual({ success: true });
});

it("returns failure when prisma throws", async () => {
    mockUpdate.mockRejectedValue(new Error("DB error"));

    const result = await resetEventNotificationGuards("event-1");

    expect(result).toEqual({ success: false });
});
});


describe("deleteEventNotifications", () => {
beforeEach(() => jest.clearAllMocks());

it("deletes unread travel and event reminder notifications for the given user and event", async () => {
    mockDeleteMany.mockResolvedValue({ count: 2 });

    const result = await deleteEventNotifications("user-1", "Test Event");

    expect(mockDeleteMany).toHaveBeenCalledWith({
    where: {
        userId: "user-1",
        isRead: false,
        OR: [
        { title: "Time to Leave", message: { contains: '"Test Event"' } },
        { title: "Event Starting Soon", message: { contains: '"Test Event"' } },
        ],
    },
    });
    expect(result).toEqual({ success: true });
});

it("returns failure when prisma throws", async () => {
    mockDeleteMany.mockRejectedValue(new Error("DB error"));

    const result = await deleteEventNotifications("user-1", "Test Event");

    expect(result).toEqual({ success: false });
});
});