/**
 * Testing for wellbeing/center api route
 */

import { GET } from "../route";

// Mocks

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any) => ({
      status: 200,
      json: async () => data,
    }),
  },
}));

// Tests

describe("GET /api/quote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFetch = (responses: any[]) => {
    global.fetch = jest.fn();

    responses.forEach((res) => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(res);
    });
  };

  it("returns a valid quote", async () => {
    mockFetch([
      {
        ok: true,
        text: async () =>
          JSON.stringify({ quoteText: "Short inspirational quote" }),
      },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(data.quote).toBe("Short inspirational quote");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries when quoteText is missing", async () => {
    mockFetch([
      { ok: true, text: async () => JSON.stringify({}) },
      {
        ok: true,
        text: async () =>
          JSON.stringify({ quoteText: "Valid quote" }),
      },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(data.quote).toBe("Valid quote");
  });

  it("rejects quotes longer than max_length", async () => {
    const longQuote = "a".repeat(200);

    mockFetch([
      {
        ok: true,
        text: async () => JSON.stringify({ quoteText: longQuote }),
      },
      {
        ok: true,
        text: async () =>
          JSON.stringify({ quoteText: "Short one" }),
      },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(data.quote).toBe("Short one");
  });

  it("handles invalid JSON response", async () => {
    mockFetch([
      {
        ok: true,
        text: async () => "invalid-json",
      },
      {
        ok: true,
        text: async () =>
          JSON.stringify({ quoteText: "Recovered quote" }),
      },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(data.quote).toBe("Recovered quote");
  });

  it("handles failed fetch responses", async () => {
    mockFetch([
      { ok: false },
      {
        ok: true,
        text: async () =>
          JSON.stringify({ quoteText: "Valid after fail" }),
      },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(data.quote).toBe("Valid after fail");
  });

  it("returns fallback quote after max attempts", async () => {
    const badResponse = {
      ok: true,
      text: async () => JSON.stringify({}),
    };

    mockFetch([
      badResponse,
      badResponse,
      badResponse,
      badResponse,
      badResponse,
    ]);

    const res = await GET();
    const data = await res.json();

    expect(global.fetch).toHaveBeenCalledTimes(5);
    expect(data.quote).toBe("You can do this!");
  });
});