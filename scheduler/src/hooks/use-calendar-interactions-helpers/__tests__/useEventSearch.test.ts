// useEventSearch.test.ts
import { renderHook, act } from "@testing-library/react";
import { useEventSearch } from "../useEventSearch";

global.fetch = jest.fn();

const MOCK_EVENTS = [
  { id: "1", title: "Meeting", start: "2024-06-15T10:00:00.000Z", end: "2024-06-15T11:00:00.000Z" },
  { id: "2", title: "Lunch", start: "2024-06-15T12:00:00.000Z", end: "2024-06-15T13:00:00.000Z" },
];

beforeEach(() => {
  jest.clearAllMocks();
  (fetch as jest.Mock).mockResolvedValue({ json: async () => MOCK_EVENTS });
});

function setup() {
  const { result } = renderHook(() => useEventSearch());
  return result;
}

// ── initial state ─────────────────────────────────────────────────────────

describe("initial state", () => {
  it("starts with empty search query", () => {
    expect(setup().current.searchQuery).toBe("");
  });

  it("starts with no search results", () => {
    expect(setup().current.searchResults).toEqual([]);
  });

  it("starts with search results hidden", () => {
    expect(setup().current.showSearchResults).toBe(false);
  });
});

// ── handleSearch: empty/whitespace query ──────────────────────────────────

describe("handleSearch with empty query", () => {
  it("clears results and hides panel for empty string", async () => {
    const result = setup();
    await act(async () => { await result.current.handleSearch(""); });
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.showSearchResults).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("clears results and hides panel for whitespace-only string", async () => {
    const result = setup();
    await act(async () => { await result.current.handleSearch("   "); });
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.showSearchResults).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});

// ── handleSearch: valid query ─────────────────────────────────────────────

describe("handleSearch with valid query", () => {
  it("sets searchQuery to the provided query", async () => {
    const result = setup();
    await act(async () => { await result.current.handleSearch("meeting"); });
    expect(result.current.searchQuery).toBe("meeting");
  });

  it("shows search results panel", async () => {
    const result = setup();
    await act(async () => { await result.current.handleSearch("meeting"); });
    expect(result.current.showSearchResults).toBe(true);
  });

  it("calls fetch with encoded query", async () => {
    const result = setup();
    await act(async () => { await result.current.handleSearch("team meeting"); });
    expect(fetch).toHaveBeenCalledWith("/api/calendar/events?q=team%20meeting");
  });

  it("converts start and end strings to Date objects", async () => {
    const result = setup();
    await act(async () => { await result.current.handleSearch("meeting"); });
    expect(result.current.searchResults[0].start).toBeInstanceOf(Date);
    expect(result.current.searchResults[0].end).toBeInstanceOf(Date);
  });

  it("preserves other event fields", async () => {
    const result = setup();
    await act(async () => { await result.current.handleSearch("meeting"); });
    expect(result.current.searchResults[0].title).toBe("Meeting");
  });
});

// ── clearSearch ───────────────────────────────────────────────────────────

describe("clearSearch", () => {
  it("resets all search state", async () => {
    const result = setup();
    await act(async () => { await result.current.handleSearch("meeting"); });
    act(() => { result.current.clearSearch(); });
    expect(result.current.searchQuery).toBe("");
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.showSearchResults).toBe(false);
  });
});

// ── showSearchResultsFor ──────────────────────────────────────────────────

describe("showSearchResultsFor", () => {
  it("does not show results panel when query is empty", () => {
    const result = setup();
    act(() => { result.current.showSearchResultsFor(); });
    expect(result.current.showSearchResults).toBe(false);
  });

  it("shows results panel when query is non-empty", async () => {
    const result = setup();
    await act(async () => { await result.current.handleSearch("meeting"); });
    act(() => { result.current.showSearchResultsFor(); });
    expect(result.current.showSearchResults).toBe(true);
  });
});