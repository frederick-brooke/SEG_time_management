/**
 * Tests for src/app/api/location/search/route.ts
 *
 * This suite tests GET /api/geocode, including:
 * - missing query param
 * - successful UK/global searches
 * - deduplication and ordering
 * - fallback property mapping
 * - upstream fetch failures
 * - error handling
 */

// Mock global Response 
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

  static json(data: unknown, init?: ResponseInit) {
    return new (global.Response as any)(JSON.stringify(data), init);
  }
} as any;

import { GET } from "@/app/api/location/search/route";

// Helpers 
function makeRequest(query?: string): Request {
  const url = query
    ? `https://example.com/api/geocode?q=${encodeURIComponent(query)}`
    : "https://example.com/api/geocode";
  return new Request(url);
}

/** Create mock geocoding feature */
function makeFeature(overrides: Record<string, any> = {}) {
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

// Tests 
describe("GET /api/geocode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENROUTE_API_KEY = "test-api-key";
  });

  describe("missing query param", () => {
    it("returns empty array when q is not provided", async () => {
      const res = await GET(makeRequest());
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });

  describe("successful geocoding", () => {
    it("maps UK results correctly", async () => {
      const feature = makeFeature();
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [feature] }) });

      const res = await GET(makeRequest("Coventry"));
      const body = await res.json();

      expect(body[0].geometry.coordinates).toEqual([-1.5, 52.5]);
      expect(body[0].properties.name).toBe("Test Place");
      expect(body[0].properties.city).toBe("Coventry");
      expect(body[0].properties.display).toBe("Test Place, Coventry, UK");
    });

    it("deduplicates UK and global results", async () => {
      const feature = makeFeature();
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [feature] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [feature] }) });

      const res = await GET(makeRequest("Coventry"));
      const body = await res.json();
      expect(body).toHaveLength(1);
    });

    it("orders UK results before global results", async () => {
      const ukFeature = makeFeature({ label: "UK Place" });
      const globalFeature = makeFeature({ label: "Global Place", name: "Global Place" });

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [ukFeature] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [globalFeature] }) });

      const res = await GET(makeRequest("place"));
      const body = await res.json();

      expect(body[0].properties.display).toBe("UK Place");
      expect(body[1].properties.display).toBe("Global Place");
    });

    it("calls fetch twice with API key and boundaries", async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [] }) });

      await GET(makeRequest("test"));
      const calls = (global.fetch as jest.Mock).mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][0]).toContain("test-api-key");
      expect(calls[1][0]).toContain("test-api-key");
      expect(calls[0][0]).toContain("boundary.country=GBR");
      expect(calls[1][0]).not.toContain("boundary.country");
    });
  });

  describe("feature property mapping", () => {
    it("falls back to label when name is missing", async () => {
      const feature = makeFeature({ name: undefined });
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [feature] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) });

      const res = await GET(makeRequest("test"));
      const body = await res.json();
      expect(body[0].properties.name).toBe("Test Place, Coventry, UK");
    });

    it("uses county when locality is missing", async () => {
      const feature = makeFeature({ locality: undefined, county: "West Midlands" });
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [feature] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) });

      const res = await GET(makeRequest("test"));
      const body = await res.json();
      expect(body[0].properties.city).toBe("West Midlands");
    });

    it("returns empty string for city when both locality and county missing", async () => {
      const feature = makeFeature({ locality: undefined, county: undefined });
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [feature] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) });

      const res = await GET(makeRequest("test"));
      const body = await res.json();
      expect(body[0].properties.city).toBe("");
    });
  });

  describe("upstream failures & errors", () => {
    it("returns empty array when fetch fails", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
      const res = await GET(makeRequest("test"));
      const body = await res.json();
      expect(body).toEqual([]);
    });

    it("handles json parse errors gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => { throw new Error("JSON parse error"); } });
      const res = await GET(makeRequest("test"));
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });
});