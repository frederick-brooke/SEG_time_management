/**
 * Tests for src/app/api/location/saved/route.ts
 *
 * Covers GET and POST handlers for saved locations.
 * Auth guard behaviour is tested via a shared helper to avoid
 * duplicating identical assertions across both suites.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

// NextResponse.json is broken in Jest/JSDOM — replace with a plain Response
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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockSession = { user: { id: "user-123" } };

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

const baseLocationBody = {
  label: "Home",
  address: "1 Test St",
  lat: 52.5,
  lng: -1.5,
  type: "HOME",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePostRequest(body: object): NextRequest {
  return { json: jest.fn().mockResolvedValue(body) } as unknown as NextRequest;
}

function makeGetRequest(): NextRequest {
  return {} as unknown as NextRequest;
}

function authenticateAs(session: object | null) {
  (getServerSession as jest.Mock).mockResolvedValue(session);
}

function stubFindMany(results: object[]) {
  (prisma.savedLocation.findMany as jest.Mock).mockResolvedValue(results);
}

function stubCreate(result: object) {
  (prisma.savedLocation.create as jest.Mock).mockResolvedValue(result);
}

type HandlerFn = (req: NextRequest) => Promise<Response>;

// Shared auth guard tests — avoids duplicating 401 assertions across suites
function describeAuthGuards(getHandler: () => HandlerFn, makeReq: () => NextRequest) {
  it("returns 401 when there is no session", async () => {
    authenticateAs(null);
    const res = await getHandler()(makeReq());
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when session has no user id", async () => {
    authenticateAs({ user: {} });
    const res = await getHandler()(makeReq());
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/saved-locations", () => {
  beforeEach(() => jest.clearAllMocks());

  describeAuthGuards(() => GET, makeGetRequest);

  it("queries findMany filtered by userId with predictable ordering", async () => {
    authenticateAs(mockSession);
    stubFindMany([]);

    await GET(makeGetRequest());

    expect(prisma.savedLocation.findMany).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    });
  });

  it("returns the user's saved locations", async () => {
    authenticateAs(mockSession);
    stubFindMany([mockLocation]);

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("loc-1");
  });

  it("returns an empty array when no saved locations exist", async () => {
    authenticateAs(mockSession);
    stubFindMany([]);

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(body).toEqual([]);
  });
});

describe("POST /api/saved-locations", () => {
  beforeEach(() => jest.clearAllMocks());

  describeAuthGuards(() => POST, () => makePostRequest(baseLocationBody));

  // Validation — missing required fields

  it("returns 400 when label is missing", async () => {
    authenticateAs(mockSession);
    const { label: _, ...body } = baseLocationBody;
    const res = await POST(makePostRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing required fields");
  });

  it("returns 400 when address is missing", async () => {
    authenticateAs(mockSession);
    const { address: _, ...body } = baseLocationBody;
    const res = await POST(makePostRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing required fields");
  });

  it("returns 400 when lat is null", async () => {
    authenticateAs(mockSession);
    const res = await POST(makePostRequest({ ...baseLocationBody, lat: null }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing required fields");
  });

  it("returns 400 when lng is null", async () => {
    authenticateAs(mockSession);
    const res = await POST(makePostRequest({ ...baseLocationBody, lng: null }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing required fields");
  });

  // Type resolution

  it("defaults an unknown type to FAVOURITE", async () => {
    authenticateAs(mockSession);
    stubCreate({ ...mockLocation, type: "FAVOURITE" });

    await POST(makePostRequest({ ...baseLocationBody, type: "CAFE" }));

    expect(prisma.savedLocation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "FAVOURITE" }) })
    );
  });

  it("defaults a missing type to FAVOURITE", async () => {
    authenticateAs(mockSession);
    const { type: _, ...body } = baseLocationBody;
    stubCreate({ ...mockLocation, type: "FAVOURITE" });

    await POST(makePostRequest(body));

    expect(prisma.savedLocation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "FAVOURITE" }) })
    );
  });

  // Uniqueness enforcement

  it("deletes existing HOME location before creating a new one", async () => {
    authenticateAs(mockSession);
    stubCreate(mockLocation);

    await POST(makePostRequest({ ...baseLocationBody, type: "HOME" }));

    expect(prisma.savedLocation.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-123", type: "HOME" },
    });
  });

  it("deletes existing WORK location before creating a new one", async () => {
    authenticateAs(mockSession);
    stubCreate({ ...mockLocation, type: "WORK" });

    await POST(makePostRequest({ ...baseLocationBody, type: "WORK" }));

    expect(prisma.savedLocation.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-123", type: "WORK" },
    });
  });

  it("does not delete any location when type is FAVOURITE", async () => {
    authenticateAs(mockSession);
    stubCreate({ ...mockLocation, type: "FAVOURITE" });

    await POST(makePostRequest({ ...baseLocationBody, type: "FAVOURITE" }));

    expect(prisma.savedLocation.deleteMany).not.toHaveBeenCalled();
  });

  // Creation

  it("creates the location with the correct data payload", async () => {
    authenticateAs(mockSession);
    stubCreate(mockLocation);

    await POST(makePostRequest(baseLocationBody));

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

  it("returns the created location with status 201", async () => {
    authenticateAs(mockSession);
    stubCreate(mockLocation);

    const res = await POST(makePostRequest(baseLocationBody));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.id).toBe("loc-1");
  });
});
