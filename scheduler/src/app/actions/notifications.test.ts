import { NotificationType } from "@prisma/client";

// Mocks
jest.mock("lib/prisma", () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("lib/auth", () => ({
  authOptions: {},
}));

// Imports 
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
} from "@/app/actions/notifications";

// Typed mock helpers
const mockGetServerSession = getServerSession as jest.Mock;
const db = prisma.notification as jest.Mocked<typeof prisma.notification>;

// Shared fixtures 
const SESSION = { user: { id: "user-1" } };

const NOTIFICATION = {
  id: "notif-1",
  userId: "user-1",
  title: "Test",
  message: "Hello",
  type: "INFO" as NotificationType,
  isRead: false,
  link: null,
  expiresAt: null,
  createdAt: new Date(),
};

describe("getNotifications", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns notifications for an authenticated user", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    db.findMany.mockResolvedValue([NOTIFICATION]);

    const result = await getNotifications();

    expect(result.notifications).toEqual([NOTIFICATION]);
    expect(result.error).toBeNull();
  });

  it("queries only unread, non-expired notifications ordered by createdAt desc", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    db.findMany.mockResolvedValue([]);

    await getNotifications();

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: SESSION.user.id,
          isRead: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        }),
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("respects a custom count argument", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    db.findMany.mockResolvedValue([]);

    await getNotifications(5);

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });

  it("defaults to take: 20", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    db.findMany.mockResolvedValue([]);

    await getNotifications();

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 })
    );
  });

  it("returns error when session is missing", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await getNotifications();

    expect(result.notifications).toBeNull();
    expect(result.error).toBe("Failed to fetch notifications");
    expect(db.findMany).not.toHaveBeenCalled();
  });

  it("returns error when session has no user id", async () => {
    mockGetServerSession.mockResolvedValue({ user: {} });

    const result = await getNotifications();

    expect(result.notifications).toBeNull();
    expect(result.error).toBe("Failed to fetch notifications");
  });

  it("returns error when prisma throws", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    db.findMany.mockRejectedValue(new Error("DB error"));

    const result = await getNotifications();

    expect(result.notifications).toBeNull();
    expect(result.error).toBe("Failed to fetch notifications");
  });
});

describe("markNotificationAsRead", () => {
  beforeEach(() => jest.clearAllMocks());

  it("marks notification as read for the owning user", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    db.findUnique.mockResolvedValue(NOTIFICATION);
    db.update.mockResolvedValue({ ...NOTIFICATION, isRead: true });

    const result = await markNotificationAsRead("notif-1");

    expect(db.update).toHaveBeenCalledWith({
      where: { id: "notif-1" },
      data: { isRead: true },
    });
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  it("returns error when session is missing", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await markNotificationAsRead("notif-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to mark notifications as read");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("returns error when notification does not exist", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    db.findUnique.mockResolvedValue(null);

    const result = await markNotificationAsRead("notif-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to mark notifications as read");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("returns error when notification belongs to a different user", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    db.findUnique.mockResolvedValue({ ...NOTIFICATION, userId: "other-user" });

    const result = await markNotificationAsRead("notif-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to mark notifications as read");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("returns error when prisma throws", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    db.findUnique.mockRejectedValue(new Error("DB error"));

    const result = await markNotificationAsRead("notif-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to mark notifications as read");
  });
});

describe("markAllNotificationsAsRead", () => {
  beforeEach(() => jest.clearAllMocks());

  it("marks all unread notifications as read for the user", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    db.updateMany.mockResolvedValue({ count: 3 });

    const result = await markAllNotificationsAsRead();

    expect(db.updateMany).toHaveBeenCalledWith({
      where: { userId: SESSION.user.id, isRead: false },
      data: { isRead: true },
    });
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  it("returns error when session is missing", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await markAllNotificationsAsRead();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to mark notifications as read");
    expect(db.updateMany).not.toHaveBeenCalled();
  });

  it("returns error when session has no user id", async () => {
    mockGetServerSession.mockResolvedValue({ user: {} });

    const result = await markAllNotificationsAsRead();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to mark notifications as read");
  });

  it("returns error when prisma throws", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    db.updateMany.mockRejectedValue(new Error("DB error"));

    const result = await markAllNotificationsAsRead();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to mark notifications as read");
  });
});

describe("createNotification", () => {
  beforeEach(() => jest.clearAllMocks());

  const ARGS = {
    userId: "user-1",
    title: "Alert",
    message: "Something happened",
    type: "INFO" as NotificationType,
  };

  it("creates a notification with required fields only", async () => {
    db.create.mockResolvedValue(NOTIFICATION);

    const result = await createNotification(
      ARGS.userId, ARGS.title, ARGS.message, ARGS.type
    );

    expect(db.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: ARGS.userId,
        title: ARGS.title,
        message: ARGS.message,
        type: ARGS.type,
        link: null,
        expiresAt: null,
      }),
    });
    expect(result.notification).toEqual(NOTIFICATION);
    expect(result.error).toBeNull();
  });

  it("stores the link when provided", async () => {
    db.create.mockResolvedValue(NOTIFICATION);

    await createNotification(
      ARGS.userId, ARGS.title, ARGS.message, ARGS.type, "/dashboard"
    );

    expect(db.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ link: "/dashboard" }),
    });
  });

  it("stores null for link when not provided", async () => {
    db.create.mockResolvedValue(NOTIFICATION);

    await createNotification(ARGS.userId, ARGS.title, ARGS.message, ARGS.type);

    expect(db.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ link: null }),
    });
  });

  it("stores expiresAt as a Date when provided", async () => {
    db.create.mockResolvedValue(NOTIFICATION);
    const expiry = new Date("2099-01-01");

    await createNotification(
      ARGS.userId, ARGS.title, ARGS.message, ARGS.type, undefined, expiry
    );

    expect(db.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ expiresAt: expect.any(Date) }),
    });
  });

  it("stores null for expiresAt when not provided", async () => {
    db.create.mockResolvedValue(NOTIFICATION);

    await createNotification(ARGS.userId, ARGS.title, ARGS.message, ARGS.type);

    expect(db.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ expiresAt: null }),
    });
  });

  it("returns error when title is missing", async () => {
    const result = await createNotification(
      ARGS.userId, "", ARGS.message, ARGS.type
    );

    expect(result.notification).toBeNull();
    expect(result.error).toBe("Title, message and type are required");
    expect(db.create).not.toHaveBeenCalled();
  });

  it("returns error when message is missing", async () => {
    const result = await createNotification(
      ARGS.userId, ARGS.title, "", ARGS.type
    );

    expect(result.notification).toBeNull();
    expect(result.error).toBe("Title, message and type are required");
    expect(db.create).not.toHaveBeenCalled();
  });

  it("returns error when type is falsy", async () => {
    const result = await createNotification(
      ARGS.userId, ARGS.title, ARGS.message, "" as NotificationType
    );

    expect(result.notification).toBeNull();
    expect(result.error).toBe("Title, message and type are required");
    expect(db.create).not.toHaveBeenCalled();
  });

  it("returns error when prisma throws", async () => {
    db.create.mockRejectedValue(new Error("DB error"));

    const result = await createNotification(
      ARGS.userId, ARGS.title, ARGS.message, ARGS.type
    );

    expect(result.notification).toBeNull();
    expect(result.error).toBe("Failed to create notification");
  });
});
