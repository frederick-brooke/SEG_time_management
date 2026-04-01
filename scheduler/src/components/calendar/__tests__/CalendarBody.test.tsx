/**
 * Tests for src/components/calendar/CalendarBody.tsx
 */

import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CalendarBody from "../CalendarBody";

// Mocks

jest.mock("../CalendarBody.module.css", () =>
  new Proxy({}, { get: (_, key) => String(key) })
);
jest.mock("../SearchBar.module.css", () =>
  new Proxy({}, { get: (_, key) => String(key) })
);

jest.mock("@/lib/ui", () => ({
  CATEGORY_COLORS: { work: "#ff0000", personal: "#00ff00" },
}));

let capturedEventPropGetter: (event: any) => any;
let capturedDayPropGetter: (date: Date) => any;
let capturedEventComponent: React.ComponentType<{ event: any }>;

jest.mock("react-big-calendar", () => ({
  Calendar: ({
    onSelectEvent,
    onSelectSlot,
    onNavigate,
    events,
    eventPropGetter,
    dayPropGetter,
    components,
  }: any) => {
    capturedEventPropGetter = eventPropGetter;
    capturedDayPropGetter = dayPropGetter;
    capturedEventComponent = components?.event;
    return (
      <div data-testid="rbc-calendar">
        {events.map((ev: any) => (
          <Button
            key={ev.id}
            data-testid={`event-${ev.id}`}
            onClick={() => onSelectEvent(ev)}
          >
            {ev.title}
          </Button>
        ))}
        <Button
          data-testid="select-slot"
          onClick={() => onSelectSlot({ start: new Date("2024-06-03") })}
        >
          Select Slot
        </Button>
        <Button
          data-testid="navigate"
          onClick={() => onNavigate(new Date("2024-06-10"))}
        >
          Navigate
        </Button>
      </div>
    );
  },
}));

jest.mock("date-fns", () => ({
  format: jest.fn((date: Date, fmt: string) => {
    if (fmt === "PPP") return "June 3rd, 2024";
    if (fmt === "yyyy-MM-dd") return "2024-06-03";
    return date.toString();
  }),
}));

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
    eventId: "event-1",
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
    _eventCategory: "work",
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

// Tests

describe("CalendarBody", () => {

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
      expect(screen.queryByRole("button", { name: "✕" })).not.toBeInTheDocument();
    });

    it("should call onSearchClear when the clear button is clicked", () => {
      const onSearchClear = jest.fn();
      render(
        <CalendarBody {...createDefaultProps({ searchQuery: "meeting", onSearchClear })} />
      );
      fireEvent.click(screen.getByText("✕"));
      expect(onSearchClear).toHaveBeenCalled();
    });
  });

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

    it("should use occurrenceId as key when available", () => {
      const event = createCalendarEvent({ occurrenceId: "occ-99", id: "event-99" });
      render(
        <CalendarBody
          {...createDefaultProps({
            showSearchResults: true,
            searchResults: [event],
            searchQuery: "test",
          })}
        />
      );
      expect(screen.getByText("Test Event")).toBeInTheDocument();
    });

    it("should fall back to id as key when occurrenceId is absent", () => {
      const { occurrenceId, ...event } = createCalendarEvent({ id: "event-no-occ" });
      render(
        <CalendarBody
          {...createDefaultProps({
            showSearchResults: true,
            searchResults: [event],
            searchQuery: "test",
          })}
        />
      );
      expect(screen.getByText("Test Event")).toBeInTheDocument();
    });

    it("should apply a backgroundColor style to the search result dot for known category", () => {
      const event = createCalendarEvent({ category: "work" });
      const { container } = render(
        <CalendarBody
          {...createDefaultProps({
            showSearchResults: true,
            searchResults: [event],
            searchQuery: "test",
          })}
        />
      );
      const styledEls = Array.from(container.querySelectorAll<HTMLElement>("[style]"));
      const hasBgColor = styledEls.some((el) => el.style.backgroundColor !== "");
      expect(hasBgColor).toBe(true);
    });

    it("should apply a backgroundColor style to the search result dot for unknown category", () => {
      const event = createCalendarEvent({ category: "unknown-category" });
      const { container } = render(
        <CalendarBody
          {...createDefaultProps({
            showSearchResults: true,
            searchResults: [event],
            searchQuery: "test",
          })}
        />
      );
      const styledEls = Array.from(container.querySelectorAll<HTMLElement>("[style]"));
      const hasBgColor = styledEls.some((el) => el.style.backgroundColor !== "");
      expect(hasBgColor).toBe(true);
    });
  });

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

  describe("EventComponent", () => {
    beforeEach(() => {
      render(<CalendarBody {...createDefaultProps()} />);
    });

    it("renders TaskEventContent for task events", () => {
      const EventComp = capturedEventComponent;
      const task = createTaskEvent({ title: "My Task", priority: "Low" });
      const { getByText } = render(<EventComp event={task} />);
      expect(getByText("My Task")).toBeInTheDocument();
      expect(getByText("Low priority")).toBeInTheDocument();
      expect(getByText("✓")).toBeInTheDocument();
    });

    it("renders CalendarEventContent for regular events", () => {
      const EventComp = capturedEventComponent;
      const event = createCalendarEvent({ title: "My Meeting" });
      const { getByText } = render(<EventComp event={event} />);
      expect(getByText("My Meeting")).toBeInTheDocument();
    });

    it("renders TravelEventContent with walking icon", () => {
      const EventComp = capturedEventComponent;
      const travel = createTravelEvent({ _transportMode: "walking" });
      const { getByText } = render(<EventComp event={travel} />);
      expect(getByText("🚶")).toBeInTheDocument();
      expect(getByText("Travel")).toBeInTheDocument();
    });

    it("renders TravelEventContent with cycling icon", () => {
      const EventComp = capturedEventComponent;
      const travel = createTravelEvent({ _transportMode: "cycling" });
      const { getByText } = render(<EventComp event={travel} />);
      expect(getByText("🚴")).toBeInTheDocument();
    });

    it("renders TravelEventContent with driving icon", () => {
      const EventComp = capturedEventComponent;
      const travel = createTravelEvent({ _transportMode: "driving" });
      const { getByText } = render(<EventComp event={travel} />);
      expect(getByText("🚗")).toBeInTheDocument();
    });

    it("renders TravelEventContent with fallback 🚗 for unknown transport mode", () => {
      const EventComp = capturedEventComponent;
      const travel = createTravelEvent({ _transportMode: "teleport" });
      const { getByText } = render(<EventComp event={travel} />);
      expect(getByText("🚗")).toBeInTheDocument();
    });
  });

  describe("makeEventPropGetter", () => {
    const categories = [
      { id: "1", name: "work", color: "#ff0000" },
      { id: "2", name: "personal", color: "#00ff00" },
    ];

    beforeEach(() => {
      render(
        <CalendarBody
          {...createDefaultProps({
            categories,
            filteredItems: [
              createCalendarEvent(),
              createTaskEvent(),
              createTravelEvent(),
            ],
          })}
        />
      );
    });

    it("returns striped gradient style for travel events with known category", () => {
      const travel = createTravelEvent({ _eventCategory: "work" });
      const result = capturedEventPropGetter(travel);
      expect(result.style.background).toContain("repeating-linear-gradient");
      expect(result.style.border).toContain("dashed");
      expect(result.style.color).toBe("#ff0000");
    });

    it("falls back to #818cf8 for travel events with unknown category", () => {
      const travel = createTravelEvent({ _eventCategory: "unknown" });
      const result = capturedEventPropGetter(travel);
      expect(result.style.color).toBe("#818cf8");
    });

    it("returns backgroundColor for task events with a linked event category", () => {
      const linkedEvent = createCalendarEvent({ id: "event-1", category: "work" });
      const task = createTaskEvent({ eventId: "event-1" });
      render(
        <CalendarBody
          {...createDefaultProps({ categories, filteredItems: [linkedEvent, task] })}
        />
      );
      const result = capturedEventPropGetter(task);
      expect(result.style.backgroundColor).toBe("#ff0000");
    });

    it("falls back to #6b7280 for task events with no linked event", () => {
      const task = createTaskEvent({ eventId: "nonexistent" });
      const result = capturedEventPropGetter(task);
      expect(result.style.backgroundColor).toBe("#6b7280");
    });

    it("returns backgroundColor for regular calendar events with known category", () => {
      const event = createCalendarEvent({ category: "personal" });
      const result = capturedEventPropGetter(event);
      expect(result.style.backgroundColor).toBe("#00ff00");
    });

    it("falls back to #6366f1 for regular events with unknown category", () => {
      const event = createCalendarEvent({ category: "unknown" });
      const result = capturedEventPropGetter(event);
      expect(result.style.backgroundColor).toBe("#6366f1");
    });
  });

  describe("makeDayPropGetter", () => {
    it("does not highlight a day not matching a day-mode schedule log", () => {
      const scheduleLogs = [{ mode: "day", scheduledAt: "2024-06-03T12:00:00" }];
      const { unmount } = render(<CalendarBody {...createDefaultProps({ scheduleLogs })} />);
      const getter = capturedDayPropGetter;
      unmount();
      expect(getter(new Date("2024-06-10T12:00:00"))).toEqual({});
    });
  
    it("does not highlight days outside a week-mode schedule log", () => {
      const scheduleLogs = [{ mode: "week", scheduledAt: "2024-06-02T12:00:00" }];
      const { unmount } = render(<CalendarBody {...createDefaultProps({ scheduleLogs })} />);
      const getter = capturedDayPropGetter;
      unmount();
      expect(getter(new Date("2024-06-10T12:00:00"))).toEqual({});
    });
  
    it("does not highlight a day not in an array-mode schedule log", () => {
      const scheduleLogs = [{ days: ["2024-06-03", "2024-06-04"] }];
      const { unmount } = render(<CalendarBody {...createDefaultProps({ scheduleLogs })} />);
      const getter = capturedDayPropGetter;
      unmount();
      expect(getter(new Date("2024-06-10T12:00:00"))).toEqual({});
    });
  
    it("returns empty object when scheduleLogs is empty", () => {
      const { unmount } = render(<CalendarBody {...createDefaultProps({ scheduleLogs: [] })} />);
      const getter = capturedDayPropGetter;
      unmount();
      expect(getter(new Date("2024-06-03T12:00:00"))).toEqual({});
    });
  });

  describe("hexToRgb (via makeEventPropGetter travel branch)", () => {
    it("correctly converts a valid hex colour to r, g, b in gradient", () => {
      const categories = [{ id: "1", name: "work", color: "#4a90e2" }];
      render(
        <CalendarBody
          {...createDefaultProps({
            categories,
            filteredItems: [createTravelEvent({ _eventCategory: "work" })],
          })}
        />
      );
      const result = capturedEventPropGetter(
        createTravelEvent({ _eventCategory: "work" })
      );
      expect(result.style.background).toContain("rgba(74, 144, 226");
    });

    it("falls back to '99, 102, 241' for an invalid hex colour", () => {
      const badCategories = [{ id: "1", name: "work", color: "#ZZZZZZ" }];
      render(
        <CalendarBody
          {...createDefaultProps({
            categories: badCategories,
            filteredItems: [createTravelEvent({ _eventCategory: "work" })],
          })}
        />
      );
      const result = capturedEventPropGetter(
        createTravelEvent({ _eventCategory: "work" })
      );
      expect(result.style.background).toContain("rgba(99, 102, 241");
    });
  });
});