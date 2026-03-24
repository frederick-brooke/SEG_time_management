/**
 * Tests for src/app/api/location/saved/route.ts
 *
 * This suite tests GET and POST handlers for saved locations:
 * - GET fetches all saved locations for the current user.
 * - POST creates a new saved location, validates input, and handles type rules.
 */

// Mock Next.js server & authentication before route imports 
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { "Content-Type": "application/json" },
      }),
  },
  NextRequest: jest.requireActual("next/server").NextRequest,
}));

jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    savedLocation: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/location/saved/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Helpers 

/** Creates a mock POST request with a JSON body */
function makePostRequest(body: object): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

/** Mock authenticated session */
const mockSession = { user: { id: "user-123" } };

/** Mock location object returned by Prisma */
const mockLocation = {
  id: "loc-1",
  userId: "user-123",
  label: "Home",
  address: "1 Test St",
  lat: 52.5,
  lng: -1.5,
  type: "HOME",
  createdAt: new Date(),
};

// GET /api/saved-locations 
describe("GET /api/saved-locations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 if no session exists", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 if session has no user id", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: {} });
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns user's saved locations", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findMany as jest.Mock).mockResolvedValue([mockLocation]);

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("loc-1");
  });

  it("queries findMany with correct userId and ordering", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findMany as jest.Mock).mockResolvedValue([]);

    await GET();

    expect(prisma.savedLocation.findMany).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    });
  });

  it("returns empty array when no saved locations exist", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual([]);
  });
});

// POST /api/saved-locations
describe("POST /api/saved-locations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 if no session exists", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makePostRequest({ label: "Home", address: "1 Test St", lat: 52.5, lng: -1.5, type: "HOME" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 if session has no user id", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: {} });
    const res = await POST(makePostRequest({ label: "Home", address: "1 Test St", lat: 52.5, lng: -1.5, type: "HOME" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 if required fields are missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const missingFields = [
      { address: "1 Test St", lat: 52.5, lng: -1.5 }, 
      { label: "Home", lat: 52.5, lng: -1.5 },       
      { label: "Home", address: "1 Test St", lat: null, lng: -1.5 }, 
      { label: "Home", address: "1 Test St", lat: 52.5, lng: null }, 
    ];

    for (const body of missingFields) {
      const res = await POST(makePostRequest(body));
      const result = await res.json();
      expect(res.status).toBe(400);
      expect(result.error).toBe("Missing required fields");
    }
  });

  it("creates new location with status 201", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.create as jest.Mock).mockResolvedValue(mockLocation);

    const res = await POST(makePostRequest({ label: "Home", address: "1 Test St", lat: 52.5, lng: -1.5, type: "HOME" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.id).toBe("loc-1");
  });

  it("defaults unknown or missing type to FAVOURITE", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.create as jest.Mock).mockResolvedValue({ ...mockLocation, type: "FAVOURITE" });

    await POST(makePostRequest({ label: "Cafe", address: "2 Test St", lat: 52.5, lng: -1.5, type: "CAFE" }));
    await POST(makePostRequest({ label: "Cafe", address: "2 Test St", lat: 52.5, lng: -1.5 }));

    expect(prisma.savedLocation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "FAVOURITE" }) })
    );
  });

  it("deletes existing HOME or WORK before creating a new one", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.create as jest.Mock).mockResolvedValue(mockLocation);

    await POST(makePostRequest({ label: "Home", address: "1 Test St", lat: 52.5, lng: -1.5, type: "HOME" }));
    await POST(makePostRequest({ label: "Office", address: "2 Test St", lat: 52.5, lng: -1.5, type: "WORK" }));

    expect(prisma.savedLocation.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-123", type: "HOME" } });
    expect(prisma.savedLocation.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-123", type: "WORK" } });
  });

  it("does NOT delete for FAVOURITE type", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.create as jest.Mock).mockResolvedValue({ ...mockLocation, type: "FAVOURITE" });

    await POST(makePostRequest({ label: "Cafe", address: "2 Test St", lat: 52.5, lng: -1.5, type: "FAVOURITE" }));

    expect(prisma.savedLocation.deleteMany).not.toHaveBeenCalled();
  });

  it("creates location with correct data payload", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.create as jest.Mock).mockResolvedValue(mockLocation);

    await POST(makePostRequest({ label: "Home", address: "1 Test St", lat: 52.5, lng: -1.5, type: "HOME" }));

    expect(prisma.savedLocation.create).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        label: "Home",
        address: "1 Test St",
        lat: 52.5,
        lng: -1.5,
        type: "HOME",
      },
    });
  });
});