/**
 * Testing for travel/preview api route
 */

import { GET } from "@/app/api/travel/preview/route";
import { calculateTravelTime } from "@/lib/travel";

// Mocks

jest.mock("@/lib/travel", () => ({
  calculateTravelTime: jest.fn(),
}));

jest.mock("next/server", () => {
    return {
      NextResponse: {
        json: (data: any, init?: ResponseInit) => {
          return new Response(JSON.stringify(data), {
            status: init?.status ?? 200,
            headers: init?.headers ?? {},
          });
        },
      },
    };
  });

const mockedCalculateTravelTime = calculateTravelTime as jest.Mock;

function createRequest(params: Record<string, string | undefined>) {
    const url = new URL("http://localhost/api/travel");
  
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    });
  
    return new Request(url.toString());
  }

// Tests

describe("GET /api/travel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns duration when inputs are valid", async () => {
    mockedCalculateTravelTime.mockResolvedValue(123);

    const req = createRequest({
      start: JSON.stringify({ lat: 1, lng: 2 }),
      dest: JSON.stringify({ lat: 3, lng: 4 }),
      mode: "walking",
    });

    const res = await GET(req);
    const json = await res.json();

    expect(json).toEqual({ duration: 123 });
    expect(mockedCalculateTravelTime).toHaveBeenCalledWith(
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
      "walking"
    );

    expect(res.headers.get("Cache-Control")).toBe("no-store, max-age=0");
  });

  it("returns null when start or dest is missing", async () => {
    const req = createRequest({
      start: undefined,
      dest: JSON.stringify({ lat: 1, lng: 2 }),
    });

    const res = await GET(req);
    const json = await res.json();

    expect(json).toEqual({ duration: null });
    expect(mockedCalculateTravelTime).not.toHaveBeenCalled();
  });

  it("returns 500 and null when JSON parsing fails", async () => {
    const req = createRequest({
      start: "invalid-json",
      dest: JSON.stringify({ lat: 1, lng: 2 }),
    });

    const res = await GET(req);

    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json).toEqual({ duration: null });
  });

  it("returns null when calculateTravelTime throws", async () => {
    mockedCalculateTravelTime.mockRejectedValue(new Error("API failure"));

    const req = createRequest({
      start: JSON.stringify({ lat: 1, lng: 2 }),
      dest: JSON.stringify({ lat: 3, lng: 4 }),
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ duration: null });
  });
});