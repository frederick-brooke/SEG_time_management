/**
 * Tests for src/app/api/location/saved/[id]/route.ts
 *
 * This suite tests the DELETE and PATCH handlers for saved locations.
 * It mocks Next.js server functions, Prisma client, and session authentication.
 */

// Mock next/server before importing route handlers 
// NextResponse.json is broken in Jest/JSDOM — replace it with a plain Response
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

// Mock authentication and Prisma client
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

// Helpers 

// Creates a params object that matches the route handler's expected type
function makeParams(id: string) {
  return { params: { id } };
}

// Creates a mock NextRequest with optional JSON body and HTTP method
function makeRequest(body?: object, method = "DELETE"): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body ?? {}),
    method,
  } as unknown as NextRequest;
}

// Mock session representing an authenticated user
const mockSession = { user: { id: "user-123" } };

// Mock saved location belonging to the above user
const mockLocation = {
  id: "loc-1",
  userId: "user-123",
  label: "Home",
  address: "1 Test St",
  lat: 52.5,
  lng: -1.5,
  type: "HOME",
};

// DELETE /api/saved-locations/[id] 

describe("DELETE /api/saved-locations/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 if no session is present", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await DELETE(makeRequest(), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 if session has no user id", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: {} });

    const res = await DELETE(makeRequest(), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 if location does not exist", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await DELETE(makeRequest(), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found");
  });

  it("returns 404 if location belongs to a different user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue({
      ...mockLocation,
      userId: "other-user",
    });

    const res = await DELETE(makeRequest(), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found");
  });

  it("deletes the location successfully and returns success flag", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue(mockLocation);
    (prisma.savedLocation.delete as jest.Mock).mockResolvedValue(mockLocation);

    const res = await DELETE(makeRequest(), makeParams("loc-1"));
    const body = await res.json();

    expect(prisma.savedLocation.delete).toHaveBeenCalledWith({ where: { id: "loc-1" } });
    expect(body.success).toBe(true);
  });

  it("calls findUnique with the correct ID", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue(mockLocation);
    (prisma.savedLocation.delete as jest.Mock).mockResolvedValue(mockLocation);

    await DELETE(makeRequest(), makeParams("loc-abc"));

    expect(prisma.savedLocation.findUnique).toHaveBeenCalledWith({ where: { id: "loc-abc" } });
  });
});

// PATCH /api/saved-locations/[id]

describe("PATCH /api/saved-locations/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 if no session is present", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(makeRequest({ label: "Office" }, "PATCH"), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 if session has no user id", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: {} });

    const res = await PATCH(makeRequest({ label: "Office" }, "PATCH"), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 if location does not exist", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(makeRequest({ label: "Office" }, "PATCH"), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found");
  });

  it("returns 404 if location belongs to a different user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue({
      ...mockLocation,
      userId: "other-user",
    });

    const res = await PATCH(makeRequest({ label: "Office" }, "PATCH"), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found");
  });

  it("returns 400 if label is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue(mockLocation);

    const res = await PATCH(makeRequest({}, "PATCH"), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Label required");
  });

  it("returns 400 if label is an empty string", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue(mockLocation);

    const res = await PATCH(makeRequest({ label: "" }, "PATCH"), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Label required");
  });

  it("returns 400 if label is whitespace only", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue(mockLocation);

    const res = await PATCH(makeRequest({ label: "   " }, "PATCH"), makeParams("loc-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Label required");
  });

  it("updates the label and returns the updated location", async () => {
    const updated = { ...mockLocation, label: "Office" };
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue(mockLocation);
    (prisma.savedLocation.update as jest.Mock).mockResolvedValue(updated);

    const res = await PATCH(makeRequest({ label: "Office" }, "PATCH"), makeParams("loc-1"));
    const body = await res.json();

    expect(prisma.savedLocation.update).toHaveBeenCalledWith({
      where: { id: "loc-1" },
      data: { label: "Office" },
    });
    expect(body.label).toBe("Office");
  });

  it("trims whitespace from label before saving", async () => {
    const updated = { ...mockLocation, label: "Trimmed" };
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (prisma.savedLocation.findUnique as jest.Mock).mockResolvedValue(mockLocation);
    (prisma.savedLocation.update as jest.Mock).mockResolvedValue(updated);

    await PATCH(makeRequest({ label: "  Trimmed  " }, "PATCH"), makeParams("loc-1"));

    expect(prisma.savedLocation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { label: "Trimmed" } })
    );
  });
});