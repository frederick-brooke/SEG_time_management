import { GET, POST } from "@/app/api/preferences/route";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Mock next/server — avoids the whatwg-fetch "url is read-only" conflict
// in the jsdom test environment.
// ---------------------------------------------------------------------------
jest.mock("next/server", () => {
  const makeResponse = (body: unknown, init?: { status?: number }) => ({
    status: init?.status ?? 200,
    json: async () => body,
  });

  class MockNextRequest {
    private _url: string;
    private _method: string;
    private _body: string | undefined;

    constructor(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) {
      this._url = url;
      this._method = init?.method ?? "GET";
      this._body = init?.body;
    }

    get url() { return this._url; }
    get method() { return this._method; }

    async json() {
      return JSON.parse(this._body ?? "{}");
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => makeResponse(body, init),
    },
  };
});

jest.mock("@/lib/prisma", () => ({
  prisma: {
    userPreferences: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

// ---------------------------------------------------------------------------
// Re-import after mocks are set up
// ---------------------------------------------------------------------------
const { NextRequest } = jest.requireMock("next/server");

const mockFindUnique = prisma.userPreferences.findUnique as jest.Mock;
const mockUpsert    = prisma.userPreferences.upsert    as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeGetRequest = (userId?: string) => {
  const url = userId
    ? `http://localhost/api/preferences?userId=${userId}`
    : `http://localhost/api/preferences`;
  return new NextRequest(url, { method: "GET" });
};

const makePostRequest = (body: Record<string, unknown>) =>
  new NextRequest("http://localhost/api/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const mockPreferences = {
  id: "pref-1",
  userId: "user-123",
  workStartTime: "09:00",
  workEndTime: "17:00",
  daysOff: [],
  sessionLength: 90,
  breakLength: 15,
  breaksPerDay: 3,
  taskOrder: "hard-first",
  maxTasksPerDay: 8,
  defaultTaskDuration: 60,
  reminderDays: 2,
};

// ---------------------------------------------------------------------------
// GET /api/preferences
// ---------------------------------------------------------------------------
describe("GET /api/preferences", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when userId is missing", async () => {
    const res = await GET(makeGetRequest());
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("userId required");
  });

  it("returns preferences when they exist", async () => {
    mockFindUnique.mockResolvedValueOnce(mockPreferences);

    const res = await GET(makeGetRequest("user-123"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.preferences).toEqual(mockPreferences);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { userId: "user-123" } });
  });

  it("returns null when no preferences exist", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const res = await GET(makeGetRequest("user-456"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.preferences).toBeNull();
  });

  it("returns 500 when prisma throws", async () => {
    mockFindUnique.mockRejectedValueOnce(new Error("DB error"));

    const res = await GET(makeGetRequest("user-123"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to fetch preferences");
  });
});

// ---------------------------------------------------------------------------
// POST /api/preferences
// ---------------------------------------------------------------------------
describe("POST /api/preferences", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when userID is missing", async () => {
    const res = await POST(makePostRequest({ workStartTime: "08:00" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("User ID required");
  });

  it("creates preferences with provided data and returns success", async () => {
    mockUpsert.mockResolvedValueOnce(mockPreferences);

    const res = await POST(
      makePostRequest({
        userID: "user-123",
        workStartTime: "09:00",
        workEndTime: "17:00",
        daysOff: [],
        sessionLength: 90,
        breakLength: 15,
        breaksPerDay: 3,
        taskOrder: "hard-first",
        maxTasksPerDay: 8,
        defaultTaskDuration: 60,
        reminderDays: 2,
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.preferences).toEqual(mockPreferences);
  });

  it("calls upsert with correct where clause", async () => {
    mockUpsert.mockResolvedValueOnce(mockPreferences);

    await POST(makePostRequest({ userID: "user-123", workStartTime: "08:00" }));

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-123" } })
    );
  });

  it("uses defaults in the create block when optional fields are omitted", async () => {
    mockUpsert.mockResolvedValueOnce(mockPreferences);

    await POST(makePostRequest({ userID: "user-new" }));

    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.create).toMatchObject({
      userId: "user-new",
      workStartTime: "09:00",
      workEndTime: "17:00",
      daysOff: [],
      sessionLength: 90,
      breakLength: 15,
      breaksPerDay: 3,
      taskOrder: "hard-first",
      maxTasksPerDay: 8,
      defaultTaskDuration: 60,
      reminderDays: 2,
    });
  });

  it("passes provided values to the update block", async () => {
    mockUpsert.mockResolvedValueOnce({ ...mockPreferences, workStartTime: "08:00" });

    await POST(
      makePostRequest({ userID: "user-123", workStartTime: "08:00", breakLength: 20 })
    );

    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.update).toMatchObject({
      workStartTime: "08:00",
      breakLength: 20,
    });
  });

  it("does not include userID in the data passed to upsert", async () => {
    mockUpsert.mockResolvedValueOnce(mockPreferences);

    await POST(makePostRequest({ userID: "user-123", workStartTime: "10:00" }));

    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.update).not.toHaveProperty("userID");
    expect(upsertArg.create).not.toHaveProperty("userID");
  });

  it("returns 500 when prisma throws", async () => {
    mockUpsert.mockRejectedValueOnce(new Error("DB error"));

    const res = await POST(makePostRequest({ userID: "user-123" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to save preferences");
  });
});