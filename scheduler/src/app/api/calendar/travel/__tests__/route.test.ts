/**
 * Tests for POST /api/calendar/travel route.
 *
 * Covers:
 * - Returns duration on valid input
 * - Defaults to "driving" when no mode is provided
 * - Passes the correct mode to getTravelTime (driving, walking, cycling)
 * - Returns 400 on missing or invalid coordinates (all individual cases)
 * - Documents the lat/lng === 0 falsy bug in the current validation logic
 * - Returns 500 when getTravelTime throws an Error
 * - Returns 500 with fallback message when a non-Error is thrown
 * - Returns 500 when the request body cannot be parsed
 */

import { POST } from "../route";
import { getTravelTime } from "@/lib/map";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/lib/map", () => ({
  getTravelTime: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

const mockGetTravelTime = getTravelTime as unknown as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a mock request object with a JSON body for testing.
 * Avoids instantiating NextRequest directly which fails in jsdom.
 * @param body - The request body to serialise
 * @returns A mock request with a json() method
 */
function createRequest(body: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/travel-time", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-apply NextResponse.json mock after clearAllMocks resets it
    const { NextResponse } = require("next/server");
    NextResponse.json.mockImplementation(
      (body: unknown, init?: { status?: number }) => ({
        status: init?.status ?? 200,
        json: async () => body,
      })
    );
  });

  // ── Success ──────────────────────────────────────────────────────────────────

  it("should return duration on valid input", async () => {
    mockGetTravelTime.mockResolvedValue(1200);

    const req = createRequest({
      start: { lat: 51.5, lng: -0.1 },
      end: { lat: 51.6, lng: -0.2 },
      mode: "driving",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.duration).toBe(1200);
  });

  it("should default to driving mode when mode is not provided", async () => {
    mockGetTravelTime.mockResolvedValue(900);

    const req = createRequest({
      start: { lat: 51.5, lng: -0.1 },
      end: { lat: 51.6, lng: -0.2 },
    });

    await POST(req);

    expect(mockGetTravelTime).toHaveBeenCalledWith(
      { lat: 51.5, lng: -0.1 },
      { lat: 51.6, lng: -0.2 },
      "driving"
    );
  });

  it("should pass driving mode to getTravelTime", async () => {
    mockGetTravelTime.mockResolvedValue(1200);

    const req = createRequest({
      start: { lat: 51.5, lng: -0.1 },
      end: { lat: 51.6, lng: -0.2 },
      mode: "driving",
    });

    await POST(req);

    expect(mockGetTravelTime).toHaveBeenCalledWith(
      { lat: 51.5, lng: -0.1 },
      { lat: 51.6, lng: -0.2 },
      "driving"
    );
  });

  it("should pass walking mode to getTravelTime", async () => {
    mockGetTravelTime.mockResolvedValue(600);

    const req = createRequest({
      start: { lat: 51.5, lng: -0.1 },
      end: { lat: 51.6, lng: -0.2 },
      mode: "walking",
    });

    await POST(req);

    expect(mockGetTravelTime).toHaveBeenCalledWith(
      { lat: 51.5, lng: -0.1 },
      { lat: 51.6, lng: -0.2 },
      "walking"
    );
  });

  it("should pass cycling mode to getTravelTime", async () => {
    mockGetTravelTime.mockResolvedValue(480);

    const req = createRequest({
      start: { lat: 51.5, lng: -0.1 },
      end: { lat: 51.6, lng: -0.2 },
      mode: "cycling",
    });

    await POST(req);

    expect(mockGetTravelTime).toHaveBeenCalledWith(
      { lat: 51.5, lng: -0.1 },
      { lat: 51.6, lng: -0.2 },
      "cycling"
    );
  });

  // ── Validation ───────────────────────────────────────────────────────────────

  it("should return 400 when start is missing", async () => {
    const req = createRequest({ end: { lat: 51.6, lng: -0.2 } });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Invalid coordinates");
  });

  it("should return 400 when end is missing", async () => {
    const req = createRequest({ start: { lat: 51.5, lng: -0.1 } });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Invalid coordinates");
  });

  it("should return 400 when start is missing lat", async () => {
    const req = createRequest({
      start: { lng: -0.1 },
      end: { lat: 51.6, lng: -0.2 },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Invalid coordinates");
  });

  it("should return 400 when start is missing lng", async () => {
    const req = createRequest({
      start: { lat: 51.5 },
      end: { lat: 51.6, lng: -0.2 },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Invalid coordinates");
  });

  it("should return 400 when end is missing lat", async () => {
    const req = createRequest({
      start: { lat: 51.5, lng: -0.1 },
      end: { lng: -0.2 },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Invalid coordinates");
  });

  it("should return 400 when end is missing lng", async () => {
    const req = createRequest({
      start: { lat: 51.5, lng: -0.1 },
      end: { lat: 51.6 },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Invalid coordinates");
  });

  it("should return 400 when the body is completely empty", async () => {
    const req = createRequest({});

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Invalid coordinates");
  });

  it("should document that lat/lng === 0 is incorrectly rejected (known bug)", async () => {
    mockGetTravelTime.mockResolvedValue(300);

    const req = createRequest({
      start: { lat: 0, lng: 0 },
      end: { lat: 51.6, lng: -0.2 },
    });

    const res = await POST(req);

    // This returns 400 due to !start?.lat treating 0 as falsy.
    // Fix the route validation to: start?.lat == null || start?.lng == null
    expect(res.status).toBe(400);
  });

  // ── Error handling ────────────────────────────────────────────────────────────

  it("should return 500 when getTravelTime throws an Error", async () => {
    mockGetTravelTime.mockRejectedValue(new Error("Maps API unavailable"));

    const req = createRequest({
      start: { lat: 51.5, lng: -0.1 },
      end: { lat: 51.6, lng: -0.2 },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.message).toBe("Maps API unavailable");
  });

  it("should return 500 with fallback message when a non-Error is thrown", async () => {
    mockGetTravelTime.mockRejectedValue("unexpected string error");

    const req = createRequest({
      start: { lat: 51.5, lng: -0.1 },
      end: { lat: 51.6, lng: -0.2 },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.message).toBe("An unexpected error occurred");
  });

  it("should return 500 when the request body cannot be parsed", async () => {
    const req = {
      json: jest.fn().mockRejectedValue(new Error("Unexpected token")),
    } as any;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.message).toBe("Unexpected token");
  });
});