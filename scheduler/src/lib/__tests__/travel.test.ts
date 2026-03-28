

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { calculateTravelTime } from "./travel";


const START = { lat: 51.5, lng: -0.1 };
const DEST = { lat: 51.6, lng: -0.2 };

const okResponse = (durationSeconds: number) =>
  Promise.resolve({
    ok: true,
    json: async () => ({
      routes: [{ summary: { duration: durationSeconds } }],
    }),
    text: async () => "",
  });

const failResponse = (status = 500) =>
  Promise.resolve({
    ok: false,
    status,
    json: async () => ({}),
    text: async () => "Internal Server Error",
  });

const emptyRoutesResponse = () =>
  Promise.resolve({
    ok: true,
    json: async () => ({ routes: [] }),
    text: async () => "",
  });


describe("calculateTravelTime", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, OPENROUTE_API_KEY: "test-api-key" };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  // Null guard
  it("returns null when start is null", async () => {
    const result = await calculateTravelTime(null, DEST, "walking");
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null when dest is null", async () => {
    const result = await calculateTravelTime(START, null, "walking");
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null when both start and dest are null", async () => {
    const result = await calculateTravelTime(null, null, "walking");
    expect(result).toBeNull();
  });

  // Missing API key
  it("throws when OPENROUTE_API_KEY is not set", async () => {
    delete process.env.OPENROUTE_API_KEY;
    await expect(calculateTravelTime(START, DEST, "walking")).rejects.toThrow(
      "Missing OPENROUTE_API_KEY"
    );
  });

  // Successful responses
  it("returns duration in minutes rounded from seconds", async () => {
    mockFetch.mockResolvedValueOnce(okResponse(1500)); // 1500s = 25 mins
    const result = await calculateTravelTime(START, DEST, "walking");
    expect(result).toBe(25);
  });

  it("rounds fractional minutes correctly", async () => {
    mockFetch.mockResolvedValueOnce(okResponse(1530)); // 25.5 mins → 26
    const result = await calculateTravelTime(START, DEST, "walking");
    expect(result).toBe(26);
  });

  // Profile mapping
  it("uses foot-walking profile for walking mode", async () => {
    mockFetch.mockResolvedValueOnce(okResponse(600));
    await calculateTravelTime(START, DEST, "walking");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("foot-walking");
  });

  it("uses cycling-regular profile for cycling mode", async () => {
    mockFetch.mockResolvedValueOnce(okResponse(600));
    await calculateTravelTime(START, DEST, "cycling");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("cycling-regular");
  });

  it("uses driving-car profile for driving mode", async () => {
    mockFetch.mockResolvedValueOnce(okResponse(600));
    await calculateTravelTime(START, DEST, "driving");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("driving-car");
  });

  // Request shape
  it("sends POST request with correct coordinates", async () => {
    mockFetch.mockResolvedValueOnce(okResponse(600));
    await calculateTravelTime(START, DEST, "walking");
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.coordinates).toEqual([
      [START.lng, START.lat],
      [DEST.lng, DEST.lat],
    ]);
  });

  it("sends Authorization header with API key", async () => {
    mockFetch.mockResolvedValueOnce(okResponse(600));
    await calculateTravelTime(START, DEST, "walking");
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("test-api-key");
  });

  // Failed fetch
  it("returns null when API response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(failResponse(500));
    const result = await calculateTravelTime(START, DEST, "walking");
    expect(result).toBeNull();
  });

  it("returns null when routes array is empty", async () => {
    mockFetch.mockResolvedValueOnce(emptyRoutesResponse());
    const result = await calculateTravelTime(START, DEST, "walking");
    expect(result).toBeNull();
  });

  it("returns null when routes field is missing from response", async () => {
    mockFetch.mockResolvedValueOnce(
      Promise.resolve({ ok: true, json: async () => ({}), text: async () => "" })
    );
    const result = await calculateTravelTime(START, DEST, "walking");
    expect(result).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await calculateTravelTime(START, DEST, "walking");
    expect(result).toBeNull();
  });
});
