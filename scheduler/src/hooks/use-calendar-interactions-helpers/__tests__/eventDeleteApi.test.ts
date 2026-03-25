// eventDeleteApi.test.ts
import { getDeleteConfirmMsg, deleteEventRequest } from "../eventDeleteApi";

global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

// ── getDeleteConfirmMsg ───────────────────────────────────────────────────

describe("getDeleteConfirmMsg", () => {
  it("returns single-occurrence message for 'single' mode", () => {
    expect(getDeleteConfirmMsg("single")).toBe("Remove only this specific occurrence?");
  });

  it("returns series message for 'series' mode", () => {
    expect(getDeleteConfirmMsg("series")).toBe("Delete the entire recurring series?");
  });
});

// ── deleteEventRequest ────────────────────────────────────────────────────

describe("deleteEventRequest", () => {
  const mockFetch = fetch as jest.Mock;

  it("calls fetch with DELETE method", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    await deleteEventRequest("abc123", "series", "2024-01-01T00:00:00.000Z");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      { method: "DELETE" },
    );
  });

  it("includes id and mode in query params", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    await deleteEventRequest("abc123", "series", "2024-01-01T00:00:00.000Z");
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("id=abc123");
    expect(url).toContain("mode=series");
  });

  it("appends date param when mode is 'single'", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    await deleteEventRequest("abc123", "single", "2024-06-15T10:00:00.000Z");
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("date=2024-06-15T10%3A00%3A00.000Z");
  });

  it("does not append date param when mode is 'series'", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    await deleteEventRequest("abc123", "series", "2024-06-15T10:00:00.000Z");
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).not.toContain("date=");
  });

  it("returns the fetch response", async () => {
    const mockResponse = { ok: true, status: 200 };
    mockFetch.mockResolvedValueOnce(mockResponse);
    const result = await deleteEventRequest("abc123", "series", "2024-01-01T00:00:00.000Z");
    expect(result).toBe(mockResponse);
  });
});