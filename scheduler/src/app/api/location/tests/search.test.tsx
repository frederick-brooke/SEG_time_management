/**
 * Tests for src/app/api/location/search/route.ts
 *
 * Covers GET /api/geocode including:
 * - missing query param
 * - successful UK/global searches
 * - deduplication and ordering
 * - fallback property mapping
 * - upstream fetch failures and JSON parse errors
 * - non-ok upstream responses
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { "Content-Type": "application/json" },
      }),
  },
}));

global.Response = class {
  private body: string;
  public status: number;

  constructor(body: string, init?: ResponseInit) {
    this.body = body;
    this.status = init?.status ?? 200;
  }

  async json() {
    return JSON.parse(this.body);
  }
} as any;

import { GET } from "@/app/api/location/search/route";

function makeRequest(query?: string): Request {
  const url = query
    ? `https://example.com/api/geocode?q=${encodeURIComponent(query)}`
    : "https://example.com/api/geocode";
  return new Request(url);
}

function makeFeature(overrides: Record<string, unknown> = {}) {
  return {
    geometry: { coordinates: [-1.5, 52.5] },
    properties: {
      name: "Test Place",
      label: "Test Place, Coventry, UK",
      locality: "Coventry",
      county: "",
      ...overrides,
    },
  };
}

function makeFetchResponse(features: unknown[]) {
  return { ok: true, json: async () => ({ features }) };
}

function stubUkOnly(feature: unknown) {
  global.fetch = jest.fn()
    .mockResolvedValueOnce(makeFetchResponse([feature]))
    .mockResolvedValueOnce(makeFetchResponse([]));
}

function stubBothSearches(ukFeatures: unknown[], globalFeatures: unknown[]) {
  global.fetch = jest.fn()
    .mockResolvedValueOnce(makeFetchResponse(ukFeatures))
    .mockResolvedValueOnce(makeFetchResponse(globalFeatures));
}

describe("GET /api/geocode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENROUTE_API_KEY = "test-api-key";
  });

  /**
   * Returns an empty array when the q param is completely absent from the URL.
   */
  it("returns empty array when q param is not provided", async () => {
    const res = await GET(makeRequest());
    expect(await res.json()).toEqual([]);
  });

  /**
   * Returns an empty array when the q param is present but contains only whitespace.
   */
  it("returns empty array when q param is blank", async () => {
    const res = await GET(makeRequest("   "));
    expect(await res.json()).toEqual([]);
  });

  /**
   * Verifies the route always fires two fetches: one scoped to GBR and one global.
   */
  it("calls fetch twice — once UK-bounded, once global", async () => {
    stubBothSearches([], []);

    await GET(makeRequest("test"));

    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toContain("boundary.country=GBR");
    expect(calls[1][0]).not.toContain("boundary.country");
  });

  /**
   * Verifies the API key is forwarded in both upstream fetch calls.
   */
  it("includes the API key in both fetch calls", async () => {
    stubBothSearches([], []);

    await GET(makeRequest("test"));

    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls[0][0]).toContain("test-api-key");
    expect(calls[1][0]).toContain("test-api-key");
  });

  /**
   * Verifies that a standard feature is mapped to the expected shape with
   * correct name, city, and display fields.
   */
  it("maps UK results to the expected shape", async () => {
    stubUkOnly(makeFeature());

    const body = await (await GET(makeRequest("Coventry"))).json();

    expect(body[0].geometry.coordinates).toEqual([-1.5, 52.5]);
    expect(body[0].properties.name).toBe("Test Place");
    expect(body[0].properties.city).toBe("Coventry");
    expect(body[0].properties.display).toBe("Test Place, Coventry, UK");
  });

  /**
   * Covers the name fallback branch: when name is missing, label is used instead.
   */
  it("falls back to label when name is missing", async () => {
    stubUkOnly(makeFeature({ name: undefined }));

    const body = await (await GET(makeRequest("test"))).json();

    expect(body[0].properties.name).toBe("Test Place, Coventry, UK");
  });

  /**
   * Covers the final fallback branch in mapFeature: when both name and label
   * are missing, the name should default to "Unknown".
   */
  it("falls back to Unknown when both name and label are missing", async () => {
    stubUkOnly(makeFeature({ name: undefined, label: undefined }));

    const body = await (await GET(makeRequest("test"))).json();

    expect(body[0].properties.name).toBe("Unknown");
  });

  /**
   * Covers the city fallback branch: when locality is absent, county is used.
   */
  it("uses county as city when locality is missing", async () => {
    stubUkOnly(makeFeature({ locality: undefined, county: "West Midlands" }));

    const body = await (await GET(makeRequest("test"))).json();

    expect(body[0].properties.city).toBe("West Midlands");
  });

  /**
   * Covers the empty-string city branch: when both locality and county are
   * absent, city defaults to an empty string.
   */
  it("returns empty string for city when both locality and county are missing", async () => {
    stubUkOnly(makeFeature({ locality: undefined, county: undefined }));

    const body = await (await GET(makeRequest("test"))).json();

    expect(body[0].properties.city).toBe("");
  });

  /**
   * Verifies UK results appear before global results in the final array.
   */
  it("places UK results before global results", async () => {
    const ukFeature = makeFeature({ label: "UK Place" });
    const globalFeature = makeFeature({ label: "Global Place", name: "Global Place" });
    stubBothSearches([ukFeature], [globalFeature]);

    const body = await (await GET(makeRequest("place"))).json();

    expect(body[0].properties.display).toBe("UK Place");
    expect(body[1].properties.display).toBe("Global Place");
  });

  /**
   * Verifies that a result appearing in both UK and global responses is only
   * included once, with the UK copy taking priority.
   */
  it("deduplicates results that share the same display label", async () => {
    const feature = makeFeature();
    stubBothSearches([feature], [feature]);

    const body = await (await GET(makeRequest("Coventry"))).json();

    expect(body).toHaveLength(1);
  });

  /**
   * Verifies the outer catch block returns an empty array when fetch rejects
   * entirely due to a network-level error.
   */
  it("returns empty array when fetch throws a network error", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    const body = await (await GET(makeRequest("test"))).json();

    expect(body).toEqual([]);
  });

  /**
   * Verifies the safeJson try/catch returns empty features when the upstream
   * response body cannot be parsed as JSON.
   */
  it("returns empty array when response JSON parsing fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new Error("JSON parse error"); },
    });

    const body = await (await GET(makeRequest("test"))).json();

    expect(body).toEqual([]);
  });

  /**
   * Covers the safeJson early-return branch: when the upstream response has
   * ok: false, safeJson returns empty features without attempting to parse.
   */
  it("returns empty array when upstream responds with non-ok status", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    const body = await (await GET(makeRequest("test"))).json();

    expect(body).toEqual([]);
  });

  /**
   * Covers the mapFeatures default parameter branch: when the upstream response
   * omits the features array entirely, it defaults to empty rather than throwing.
   */
  it("handles undefined features array gracefully", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const body = await (await GET(makeRequest("test"))).json();

    expect(body).toEqual([]);
  });
});