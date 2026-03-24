import React from "react";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import FriendMapPage from "./page";

// Mocks 

// Mock NextAuth session — controls whether the user appears authenticated
const mockGetServerSession = jest.fn();
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn((...args: unknown[]) => mockGetServerSession(...args)),
}));

// Mock Prisma — prevents real database calls during tests
const mockFindMany = jest.fn();
jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    friendRequest: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

// Mock FriendMap and capture the props it receives for assertion
const mockFriendMap = jest.fn(
  (_props: { friends: any[] }) => <div data-testid="friend-map" />,
);
jest.mock("@/src/components/friend-map/map", () => ({
  FriendMap: (props: { friends: any[] }) => mockFriendMap(props),
}));

// Tests 

describe("FriendMapPage (server page)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws if user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    await expect(FriendMapPage()).rejects.toThrow("Not authenticated");
    // Prisma should never be reached if auth fails
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("fetches friends and passes mapped data to FriendMap", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { id: "user-1" } });

    /**
     * Two friend requests covering both directions:
     *   - Request 1: current user is the sender → friend is the receiver
     *   - Request 2: current user is the receiver → friend is the sender
     * Request 2's sender has no fname/lname to test the username fallback.
     */
    mockFindMany.mockResolvedValueOnce([
      {
        senderId: "user-1",
        receiverId: "friend-1",
        sender: {
          id: "user-1", username: "me", fname: "Me", lname: "User",
          city: "MyCity", country: "MyCountry", location: { lat: 1, lng: 2 }, pfp: "me.png",
        },
        receiver: {
          id: "friend-1", username: "friend1", fname: "Friend", lname: "One",
          city: "CityA", country: "CountryA", location: { lat: 10, lng: 20 }, pfp: "friend1.png",
        },
      },
      {
        senderId: "friend-2",
        receiverId: "user-1",
        sender: {
          id: "friend-2", username: "friend2", fname: null, lname: null,
          city: "CityB", country: "CountryB", location: { lat: -5, lng: 30 }, pfp: "friend2.png",
        },
        receiver: {
          id: "user-1", username: "me", fname: "Me", lname: "User",
          city: "MyCity", country: "MyCountry", location: { lat: 1, lng: 2 }, pfp: "me.png",
        },
      },
    ]);

    const tree = (await FriendMapPage()) as ReactElement;
    render(tree);

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockFriendMap).toHaveBeenCalledTimes(1);

    const props = (mockFriendMap as jest.Mock).mock.calls[0][0] as { friends: any[] };
    expect(Array.isArray(props.friends)).toBe(true);
    expect(props.friends).toHaveLength(2);

    // Current user is sender → friend is the receiver
    expect(props.friends[0]).toMatchObject({
      id: "friend-1",
      username: "friend1",
      name: "Friend One",
      city: "CityA",
      country: "CountryA",
      location: { lat: 10, lng: 20 },
      pfp: "friend1.png",
    });

    // Current user is receiver → friend is the sender; name falls back to username
    expect(props.friends[1]).toMatchObject({
      id: "friend-2",
      username: "friend2",
      name: "friend2", // fname and lname are null so username is used
      city: "CityB",
      country: "CountryB",
      location: { lat: -5, lng: 30 },
      pfp: "friend2.png",
    });
  });
});