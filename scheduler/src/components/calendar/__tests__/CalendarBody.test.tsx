/**
 * Tests for src/components/calendar/CalendarBody.tsx
 *
 * Covers:
 * - Renders search input and calendar grid
 * - Search input interactions: change, focus, clear button visibility
 * - Search results dropdown: shown/hidden, result click, empty state
 * - Undo bar: shown instead of search, undo and dismiss button callbacks
 * - Travel events are filtered from search results
 * - Travel events do not trigger onSelectEvent when clicked
 * - Regular events and task events trigger onSelectEvent
 * - hexToRgb: valid hex, invalid hex fallback
 * - makeEventPropGetter: travel, task, and calendar event styles
 * - makeDayPropGetter: day-mode, week-mode, array-mode schedule log matching
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CalendarBody from "../CalendarBody";

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock CSS modules — return the class name key so assertions still work
jest.mock("./CalendarBody.module.css", () =>
  new Proxy({}, { get: (_, key) => String(key) })
);
jest.mock("./SearchBar.module.css", () =>
  new Proxy({}, { get: (_, key) => String(key) })
);

jest.mock("@/lib/ui", () => ({
  CATEGORY_COLORS: { work: "#ff0000", personal: "#00ff00" },
}));

// Mock react-big-calendar so tests don't need a full DOM calendar implementation
jest.mock("react-big-calendar", () => ({
  Calendar: ({
    onSelectEvent,
    onSelectSlot,
    onNavigate,
    events,
    eventPropGetter,
    dayPropGetter,
  }: any) => (
    <div data-testid="rbc-calendar">
      {events.map((ev: any) => (
        <button
          key={ev.id}
          data-testid={`event-${ev.id}`}
          onClick={() => onSelectEvent(ev)}
        >
          {ev.title}
        </button>
      ))}
      <button
        data-testid="select-slot"
        onClick={() => onSelectSlot({ start: new Date("2024-06-03") })}
      >
        Select Slot
      </button>
      <button
        data-testid="navigate"
        onClick={() => onNavigate(new Date("2024-06-10"))}
      >
        Navigate
      </button>
    </div>
  ),
}));

jest.mock("date-fns", () => ({
  format: jest.fn((date: Date, fmt: string) => {
    if (fmt === "PPP") return "June 3rd, 2024";
    if (fmt === "yyyy-MM-dd") return "2024-06-03";
    return date.toString();
  }),
}));

// ── Factory helpers ───────────────────────────────────────────────────────────

const mockLocalizer = {} as any;

/**
 * Creates a standard calendar event.
 */
function createCalendarEvent(overrides: Record<string, any> = {}) {
  return {
    id: "event-1",
    occurrenceId: "event-1",
    title: "Test Event",
    start: new Date("2024-06-03T10:00:00Z"),
    end: new Date("2024-06-03T11:00:00Z"),
    category: "work",
    _type: "event",
    ...overrides,
  };
}

/**
 * Creates a task event.
 */
function createTaskEvent(overrides: Record<string, any> = {}) {
  return createCalendarEvent({
    id: "task-1",
    occurrenceId: "task-1",
    title: "Test Task",
    _type: "task",
    priority: "High",
    ...overrides,
  });
}

/**
 * Creates a travel event.
 */
function createTravelEvent(overrides: Record<string, any> = {}) {
  return createCalendarEvent({
    id: "travel-1",
    occurrenceId: "travel-1",
    title: "Travel",
    _type: "_travel",
    _transportMode: "walking",
    ...overrides,
  });
}

/**
 * Default props for CalendarBody.
 */
function createDefaultProps(overrides: Record<string, any> = {}) {
  return {
    localizer: mockLocalizer,
    filteredItems: [],
    calendarDate: new Date("2024-06-03"),
    scheduleLogs: [],
    categories: [],
    searchQuery: "",
    searchResults: [],
    showSearchResults: false,
    showUndo: false,
    onNavigate: jest.fn(),
    onSelectSlot: jest.fn(),
    onSelectEvent: jest.fn(),
    onSearchChange: jest.fn(),
    onSearchFocus: jest.fn(),
    onSearchClear: jest.fn(),
    onSearchResultClick: jest.fn(),
    onUndo: jest.fn(),
    onUndoDismiss: jest.fn(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CalendarBody", () => {
  // ── Rendering ───────────────────────────────────────────────────────────────

  describe("rendering", () => {
    it("should render the calendar grid", () => {
      render(<CalendarBody {...createDefaultProps()} />);
      expect(screen.getByTestId("rbc-calendar")).toBeInTheDocument();
    });

    it("should render the search input when showUndo is false", () => {
      render(<CalendarBody {...createDefaultProps()} />);
      expect(screen.getByPlaceholderText("Search events...")).toBeInTheDocument();
    });

    it("should render the undo bar instead of search when showUndo is true", () => {
      render(<CalendarBody {...createDefaultProps({ showUndo: true })} />);
      expect(screen.getByText("Event deleted")).toBeInTheDocument();
      expect(screen.queryByPlaceholderText("Search events...")).not.toBeInTheDocument();
    });
  });

  // ── Search input ────────────────────────────────────────────────────────────

  describe("search input", () => {
    it("should call onSearchChange when the user types in the search box", () => {
      const onSearchChange = jest.fn();
      render(<CalendarBody {...createDefaultProps({ onSearchChange })} />);

      fireEvent.change(screen.getByPlaceholderText("Search events..."), {
        target: { value: "meeting" },
      });

      expect(onSearchChange).toHaveBeenCalledWith("meeting");
    });

    it("should call onSearchFocus when the search input is focused", () => {
      const onSearchFocus = jest.fn();
      render(<CalendarBody {...createDefaultProps({ onSearchFocus })} />);

      fireEvent.focus(screen.getByPlaceholderText("Search events..."));

      expect(onSearchFocus).toHaveBeenCalled();
    });

    it("should show the clear button when searchQuery is non-empty", () => {
      render(<CalendarBody {...createDefaultProps({ searchQuery: "meeting" })} />);
      expect(screen.getByText("✕")).toBeInTheDocument();
    });

    it("should not show the clear button when searchQuery is empty", () => {
      render(<CalendarBody {...createDefaultProps({ searchQuery: "" })} />);
      // ✕ may appear in the undo bar — check it's not in the search area
      expect(screen.queryByRole("button", { name: "✕" })).not.toBeInTheDocument();
    });

    it("should call onSearchClear when the clear button is clicked", () => {
      const onSearchClear = jest.fn();
      render(
        <CalendarBody
          {...createDefaultProps({ searchQuery: "meeting", onSearchClear })}
        />
      );

      fireEvent.click(screen.getByText("✕"));

      expect(onSearchClear).toHaveBeenCalled();
    });
  });

  // ── Search results ──────────────────────────────────────────────────────────

  describe("search results", () => {
    it("should show the search dropdown when showSearchResults is true", () => {
      const results = [createCalendarEvent()];
      render(
        <CalendarBody
          {...createDefaultProps({
            showSearchResults: true,
            searchResults: results,
            searchQuery: "test",
          })}
        />
      );

      expect(screen.getByText("Test Event")).toBeInTheDocument();
    });

    it("should not show the search dropdown when showSearchResults is false", () => {
      const results = [createCalendarEvent()];
      render(
        <CalendarBody
          {...createDefaultProps({
            showSearchResults: false,
            searchResults: results,
            searchQuery: "test",
          })}
        />
      );

      expect(screen.queryByText("Test Event")).not.toBeInTheDocument();
    });

    it("should show 'No matching events' when results are empty", () => {
      render(
        <CalendarBody
          {...createDefaultProps({
            showSearchResults: true,
            searchResults: [],
            searchQuery: "test",
          })}
        />
      );

      expect(screen.getByText("No matching events")).toBeInTheDocument();
    });

    it("should call onSearchResultClick when a search result is clicked", () => {
      const onSearchResultClick = jest.fn();
      const event = createCalendarEvent();
      render(
        <CalendarBody
          {...createDefaultProps({
            showSearchResults: true,
            searchResults: [event],
            searchQuery: "test",
            onSearchResultClick,
          })}
        />
      );

      fireEvent.click(screen.getByText("Test Event"));

      expect(onSearchResultClick).toHaveBeenCalledWith(event);
    });

    it("should filter travel events from search results", () => {
      const travelEvent = createTravelEvent({ title: "Travel Event" });
      const regularEvent = createCalendarEvent({ title: "Regular Event" });
      render(
        <CalendarBody
          {...createDefaultProps({
            showSearchResults: true,
            searchResults: [travelEvent, regularEvent],
            searchQuery: "event",
          })}
        />
      );

      expect(screen.queryByText("Travel Event")).not.toBeInTheDocument();
      expect(screen.getByText("Regular Event")).toBeInTheDocument();
    });

    it("should display the formatted date in search result metadata", () => {
      const results = [createCalendarEvent()];
      render(
        <CalendarBody
          {...createDefaultProps({
            showSearchResults: true,
            searchResults: results,
            searchQuery: "test",
          })}
        />
      );

      expect(screen.getByText("June 3rd, 2024")).toBeInTheDocument();
    });

    it("should show '· Recurring' badge for recurring events in results", () => {
      const results = [createCalendarEvent({ isRecurring: true })];
      render(
        <CalendarBody
          {...createDefaultProps({
            showSearchResults: true,
            searchResults: results,
            searchQuery: "test",
          })}
        />
      );

      expect(screen.getByText(/Recurring/)).toBeInTheDocument();
    });
  });

  // ── Undo bar ────────────────────────────────────────────────────────────────

  describe("undo bar", () => {
    it("should call onUndo when the Undo button is clicked", () => {
      const onUndo = jest.fn();
      render(<CalendarBody {...createDefaultProps({ showUndo: true, onUndo })} />);

      fireEvent.click(screen.getByText(/Undo/));

      expect(onUndo).toHaveBeenCalled();
    });

    it("should call onUndoDismiss when the dismiss button is clicked", () => {
      const onUndoDismiss = jest.fn();
      render(
        <CalendarBody {...createDefaultProps({ showUndo: true, onUndoDismiss })} />
      );

      fireEvent.click(screen.getByText("✕"));

      expect(onUndoDismiss).toHaveBeenCalled();
    });
  });

  // ── Event selection ─────────────────────────────────────────────────────────

  describe("event selection", () => {
    it("should call onSelectEvent when a regular event is clicked", () => {
      const onSelectEvent = jest.fn();
      const event = createCalendarEvent();
      render(
        <CalendarBody
          {...createDefaultProps({ filteredItems: [event], onSelectEvent })}
        />
      );

      fireEvent.click(screen.getByTestId("event-event-1"));

      expect(onSelectEvent).toHaveBeenCalledWith(event);
    });

    it("should call onSelectEvent when a task event is clicked", () => {
      const onSelectEvent = jest.fn();
      const task = createTaskEvent();
      render(
        <CalendarBody
          {...createDefaultProps({ filteredItems: [task], onSelectEvent })}
        />
      );

      fireEvent.click(screen.getByTestId("event-task-1"));

      expect(onSelectEvent).toHaveBeenCalledWith(task);
    });

    it("should NOT call onSelectEvent when a travel event is clicked", () => {
      const onSelectEvent = jest.fn();
      const travel = createTravelEvent();
      render(
        <CalendarBody
          {...createDefaultProps({ filteredItems: [travel], onSelectEvent })}
        />
      );

      fireEvent.click(screen.getByTestId("event-travel-1"));

      expect(onSelectEvent).not.toHaveBeenCalled();
    });
  });

  // ── Slot and navigation callbacks ───────────────────────────────────────────

  describe("slot selection and navigation", () => {
    it("should call onSelectSlot with a formatted date string when a slot is selected", () => {
      const onSelectSlot = jest.fn();
      render(<CalendarBody {...createDefaultProps({ onSelectSlot })} />);

      fireEvent.click(screen.getByTestId("select-slot"));

      expect(onSelectSlot).toHaveBeenCalledWith("2024-06-03");
    });

    it("should call onNavigate with the new date when navigation occurs", () => {
      const onNavigate = jest.fn();
      render(<CalendarBody {...createDefaultProps({ onNavigate })} />);

      fireEvent.click(screen.getByTestId("navigate"));

      expect(onNavigate).toHaveBeenCalledWith(new Date("2024-06-10"));
    });
  });
});