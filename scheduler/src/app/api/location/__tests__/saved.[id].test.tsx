/**
 * Tests for src/app/api/location/saved/[id]/route.ts
 *
 * Covers DELETE and PATCH handlers for saved locations.
 * Auth and ownership guard behaviour is tested via a shared helper
 * to avoid duplicating identical assertions across both suites.
 */

//  Mocks 

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
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { NextRequest } from "next/server";
import { DELETE, PATCH } from "@/app/api/location/saved/[id]/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Fixtures 

const mockSession = { user: { id: "user-123" } };

const mockLocation = {
  id: "loc-1",
  userId: "user-123",
  label: "Home",
  address: "1 Test St",
  lat: 52.5,
  lng: -1.5,
  type: "HOME",
};

// Helpers 

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body?: object): NextRequest {
  return { json: jest.fn().mockResolvedValue(body ?? {}) } as unknown as NextRequest;
}

function authenticateAs(session: object | null) {
  (getServerSession as jest.Mock).mockResolvedValue(session);
}

function stubLocation(location: object | null) {
  (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue(location);
}

type HandlerFn = (req: NextRequest, ctx: ReturnType<typeof makeParams>) => Promise<Response>;

// Shared guard tests used by both DELETE and PATCH suites to avoid duplication
function describeAuthAndOwnershipGuards(getHandler: () => HandlerFn) {
  it("returns 401 when there is no session", async () => {
    authenticateAs(null);
    const res = await getHandler()(makeRequest(), makeParams("loc-1"));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when session has no user id", async () => {
    authenticateAs({ user: {} });
    const res = await getHandler()(makeRequest(), makeParams("loc-1"));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when location does not exist", async () => {
    authenticateAs(mockSession);
    stubLocation(null);
    const res = await getHandler()(makeRequest(), makeParams("loc-1"));
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found");
  });

  it("returns 404 when location belongs to a different user", async () => {
    authenticateAs(mockSession);
    stubLocation({ ...mockLocation, userId: "other-user" });
    const res = await getHandler()(makeRequest(), makeParams("loc-1"));
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found");
  });
}

// Tests 

describe("DELETE /api/saved-locations/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  describeAuthAndOwnershipGuards(() => DELETE);

  it("queries findUnique with the correct location id", async () => {
    authenticateAs(mockSession);
    stubLocation(mockLocation);
    (prisma.savedLocation.delete as jest.Mock).mockResolvedValue(mockLocation);

    await DELETE(makeRequest(), makeParams("loc-abc"));

    expect(prisma.savedLocation.findUnique).toHaveBeenCalledWith({ where: { id: "loc-abc" } });
  });

  it("deletes the location and returns a success flag", async () => {
    authenticateAs(mockSession);
    stubLocation(mockLocation);
    (prisma.savedLocation.delete as jest.Mock).mockResolvedValue(mockLocation);

    const res = await DELETE(makeRequest(), makeParams("loc-1"));
    const body = await res.json();

    expect(prisma.savedLocation.delete).toHaveBeenCalledWith({ where: { id: "loc-1" } });
    expect(body.success).toBe(true);
  });
});

describe("PATCH /api/saved-locations/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  describeAuthAndOwnershipGuards(() => PATCH);

  it("returns 400 when label is missing", async () => {
    authenticateAs(mockSession);
    stubLocation(mockLocation);

    const res = await PATCH(makeRequest({}), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Label required");
  });

  it("returns 400 when label is an empty string", async () => {
    authenticateAs(mockSession);
    stubLocation(mockLocation);

    const res = await PATCH(makeRequest({ label: "" }), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Label required");
  });

  it("returns 400 when label is whitespace only", async () => {
    authenticateAs(mockSession);
    stubLocation(mockLocation);

    const res = await PATCH(makeRequest({ label: "   " }), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Label required");
  });

  it("updates the label and returns the updated location", async () => {
    const updated = { ...mockLocation, label: "Office" };
    authenticateAs(mockSession);
    stubLocation(mockLocation);
    (prisma.savedLocation.update as jest.Mock).mockResolvedValue(updated);

    const res = await PATCH(makeRequest({ label: "Office" }), makeParams("loc-1"));
    const body = await res.json();

    expect(prisma.savedLocation.update).toHaveBeenCalledWith({
      where: { id: "loc-1" },
      data: { label: "Office" },
    });
    expect(body.label).toBe("Office");
  });

  it("trims whitespace from label before saving", async () => {
    authenticateAs(mockSession);
    stubLocation(mockLocation);
    (prisma.savedLocation.update as jest.Mock).mockResolvedValue({ ...mockLocation, label: "Trimmed" });

    await PATCH(makeRequest({ label: "  Trimmed  " }), makeParams("loc-1"));

    expect(prisma.savedLocation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { label: "Trimmed" } })
    );
  });
});