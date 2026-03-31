/**
 * Testing for user search api route
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GET } from "../route";
import { prisma } from "@/lib/prisma";

// Mocks 

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("@/lib/auth", () => ({ authOptions: {} }));

jest.mock("@/lib/prisma", () => ({
  prisma: { friendRequest: { findMany: jest.fn() } },
}));

jest.mock("next/server", () => ({
  NextResponse: { json: jest.fn((body, init?) => ({ body, init })) },
}));

// Fixtures 

const SESSION_USER = { id: "user-1" };

const mockUser = (id: string) => ({
  id, username: `user_${id}`, fname: "Test", lname: "User", pfp: null,
});

const mockFriendRequest = (senderId: string, receiverId: string) => ({
  senderId,
  receiverId,
  status: "ACCEPTED",
  sender:   mockUser(senderId),
  receiver: mockUser(receiverId),
});

// Setup 

beforeEach(() => jest.clearAllMocks());

// Tests

describe("GET /api/friends — unauthorised", () => {
  test("returns 401 when there is no session", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    await GET();
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Unauthorized" }, { status: 401 }
    );
  });

  test("returns 401 when session has no user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: null });
    await GET();
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Unauthorized" }, { status: 401 }
    );
  });

  test("does not query the database when unauthorised", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    await GET();
    expect(prisma.friendRequest.findMany).not.toHaveBeenCalled();
  });
});

describe("GET /api/friends — authorised", () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: SESSION_USER });
  });

  test("queries accepted requests where the user is sender or receiver", async () => {
    (prisma.friendRequest.findMany as jest.Mock).mockResolvedValue([]);
    await GET();
    expect(prisma.friendRequest.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { senderId: SESSION_USER.id, status: "ACCEPTED" },
          { receiverId: SESSION_USER.id, status: "ACCEPTED" },
        ],
      },
      include: {
        sender:   { select: { id: true, username: true, fname: true, lname: true, pfp: true } },
        receiver: { select: { id: true, username: true, fname: true, lname: true, pfp: true } },
      },
    });
  });

  test("returns the receiver when the session user is the sender", async () => {
    const fr = mockFriendRequest(SESSION_USER.id, "user-2");
    (prisma.friendRequest.findMany as jest.Mock).mockResolvedValue([fr]);
    await GET();
    expect(NextResponse.json).toHaveBeenCalledWith([mockUser("user-2")]);
  });

  test("returns the sender when the session user is the receiver", async () => {
    const fr = mockFriendRequest("user-3", SESSION_USER.id);
    (prisma.friendRequest.findMany as jest.Mock).mockResolvedValue([fr]);
    await GET();
    expect(NextResponse.json).toHaveBeenCalledWith([mockUser("user-3")]);
  });

  test("handles a mix of sent and received friend requests", async () => {
    const requests = [
      mockFriendRequest(SESSION_USER.id, "user-2"), // user is sender, return receiver
      mockFriendRequest("user-3", SESSION_USER.id), // user is receiver, return sender
    ];
    (prisma.friendRequest.findMany as jest.Mock).mockResolvedValue(requests);
    await GET();
    expect(NextResponse.json).toHaveBeenCalledWith([
      mockUser("user-2"),
      mockUser("user-3"),
    ]);
  });

  test("returns an empty array when the user has no accepted friends", async () => {
    (prisma.friendRequest.findMany as jest.Mock).mockResolvedValue([]);
    await GET();
    expect(NextResponse.json).toHaveBeenCalledWith([]);
  });
});