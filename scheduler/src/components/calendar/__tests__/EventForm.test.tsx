/**
 * Tests for src/components/calendar/EventForm.tsx
 */

import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EventForm from "../EventForm";

// ── Mocks ─────────

jest.mock("../TravelSection", () => ({
  __esModule: true,
  default: () => <div data-testid="travel-section" />,
}));

jest.mock("../EventFormParts", () => ({
  TaskPromptSection: ({ onFinish }: any) => (
    <div data-testid="task-prompt">
      <Button onClick={onFinish}>Finish</Button>
    </div>
  ),
}));

// ── Hook mock ──────

const mockHandleSubmit = jest.fn((e: any, _onSuccess: any) => {
  e.preventDefault();
});
const mockHandleDelete = jest.fn();
const mockSetEditMode = jest.fn();
const mockSetTitle = jest.fn();
const mockSetCategory = jest.fn();
const mockSetStartDate = jest.fn();
const mockSetStartTime = jest.fn();
const mockSetEndDate = jest.fn();
const mockSetEndTime = jest.fn();
const mockSetRecurrenceType = jest.fn();
const mockSetRecurrenceDays = jest.fn();
const mockSetRecurrenceUntil = jest.fn();
const mockSetShowConflict = jest.fn();
const mockSaveEvent = jest.fn();

const defaultHookReturn: any = {
  showTaskPrompt: false,
  createdEventId: null,
  showConflict: false,
  pendingPayload: {},
  isGoogle: false,
  isCalculating: false,
  isRecurringEv: false,
  editMode: "series",
  title: "My Event",
  category: "Personal",
  categories: [
    { id: "cat-1", name: "Lecture", color: "#6366f1" },
    { id: "cat-2", name: "Personal", color: "#fbbf24" },
  ],
  startDate: "2024-06-03",
  startTime: "10:00",
  endDate: "2024-06-03",
  endTime: "11:00",
  recurrenceType: "none",
  recurrenceDays: [],
  recurrenceUntil: "",
  defaultUntil: "",
  travelPreview: null,
  startLocName: "",
  destLocName: "",
  transportMode: "driving",
  travelTimeMode: "auto",
  manualTravelTime: "",
  setTitle: mockSetTitle,
  setCategory: mockSetCategory,
  setStartDate: mockSetStartDate,
  setStartTime: mockSetStartTime,
  setEndDate: mockSetEndDate,
  setEndTime: mockSetEndTime,
  setRecurrenceType: mockSetRecurrenceType,
  setRecurrenceDays: mockSetRecurrenceDays,
  setRecurrenceUntil: mockSetRecurrenceUntil,
  setEditMode: mockSetEditMode,
  setShowConflict: mockSetShowConflict,
  setStartCoords: jest.fn(),
  setDestCoords: jest.fn(),
  setStartLocName: jest.fn(),
  setDestLocName: jest.fn(),
  setTransportMode: jest.fn(),
  setTravelTimeMode: jest.fn(),
  setManualTravelTime: jest.fn(),
  saveEvent: mockSaveEvent,
  handleSubmit: mockHandleSubmit,
  handleDelete: mockHandleDelete,
};

let mockHookReturn: any = { ...defaultHookReturn };

jest.mock("@/hooks/Events/useEventForm", () => ({
  useEventForm: jest.fn(() => mockHookReturn),
}));

// ── Helpers ────────

function renderForm(props: Record<string, any> = {}) {
  return render(
    <EventForm
      userId="user-123"
      initialStartDate="2024-06-03"
      initialEvent={null}
      onSuccess={jest.fn()}
      existingEvents={[]}
      {...props}
    />
  );
}

// ── Tests 

describe("EventForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHookReturn = { ...defaultHookReturn };
    mockHookReturn.handleSubmit = mockHandleSubmit;
    mockHookReturn.handleDelete = mockHandleDelete;
    mockHookReturn.setEditMode = mockSetEditMode;
    mockHookReturn.setTitle = mockSetTitle;
    mockHookReturn.setCategory = mockSetCategory;
    mockHookReturn.setRecurrenceType = mockSetRecurrenceType;
    mockHookReturn.setShowConflict = mockSetShowConflict;
    mockHookReturn.saveEvent = mockSaveEvent;
    mockHandleSubmit.mockImplementation((e: any) => e.preventDefault());
  });

  // ── Task prompt view ─────

  describe("task prompt view", () => {
    it("should render TaskPromptSection when showTaskPrompt and createdEventId are set", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        showTaskPrompt: true,
        createdEventId: "event-123",
      };
      renderForm();
      expect(screen.getByTestId("task-prompt")).toBeInTheDocument();
      expect(screen.queryByPlaceholderText("Event Title")).not.toBeInTheDocument();
    });

    it("should call onSuccess when TaskPromptSection onFinish is called", () => {
      const onSuccess = jest.fn();
      mockHookReturn = {
        ...defaultHookReturn,
        showTaskPrompt: true,
        createdEventId: "event-123",
      };
      renderForm({ onSuccess });
      fireEvent.click(screen.getByText("Finish"));
      expect(onSuccess).toHaveBeenCalled();
    });

    it("should not render TaskPromptSection when createdEventId is null", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        showTaskPrompt: true,
        createdEventId: null,
      };
      renderForm();
      expect(screen.queryByTestId("task-prompt")).not.toBeInTheDocument();
    });
  });

  // ── Conflict view 

  describe("conflict view", () => {
    it("should render the conflict warning when showConflict is true", () => {
      mockHookReturn = { ...defaultHookReturn, showConflict: true };
      renderForm();
      expect(screen.getByText("Schedule Conflict")).toBeInTheDocument();
      expect(
        screen.getByText("This overlaps with another event. Proceed?")
      ).toBeInTheDocument();
    });

    it("should call saveEvent with pendingPayload when Ignore & Save is clicked", () => {
      const payload = { title: "Test" };
      mockHookReturn = {
        ...defaultHookReturn,
        showConflict: true,
        pendingPayload: payload,
        saveEvent: mockSaveEvent,
      };
      renderForm();
      fireEvent.click(screen.getByText("Ignore & Save"));
      expect(mockSaveEvent).toHaveBeenCalledWith(payload);
    });

    it("should call setShowConflict(false) when Go Back is clicked", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        showConflict: true,
        setShowConflict: mockSetShowConflict,
      };
      renderForm();
      fireEvent.click(screen.getByText("Go Back"));
      expect(mockSetShowConflict).toHaveBeenCalledWith(false);
    });

    it("should not render the form inputs when conflict view is shown", () => {
      mockHookReturn = { ...defaultHookReturn, showConflict: true };
      renderForm();
      expect(screen.queryByPlaceholderText("Event Title")).not.toBeInTheDocument();
    });
  });

  // ── Normal form ──

  describe("normal form", () => {
    it("should render the title input with the current title", () => {
      renderForm();
      expect(screen.getByPlaceholderText("Event Title")).toHaveValue("My Event");
    });

    it("should call setTitle when the title input changes", () => {
      renderForm();
      fireEvent.change(screen.getByPlaceholderText("Event Title"), {
        target: { value: "New Title" },
      });
      expect(mockSetTitle).toHaveBeenCalledWith("New Title");
    });

    it("should render all category buttons", () => {
      renderForm();
      expect(screen.getByText("Lecture")).toBeInTheDocument();
      expect(screen.getByText("Personal")).toBeInTheDocument();
    });

    it("should call setCategory when a category button is clicked", () => {
      renderForm();
      fireEvent.click(screen.getByText("Lecture"));
      expect(mockSetCategory).toHaveBeenCalledWith("Lecture");
    });

    it("should render start and end date inputs with the correct value", () => {
      renderForm();
      const dateInputs = screen.getAllByDisplayValue("2024-06-03");
      expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    });

    it("should render the TravelSection", () => {
      renderForm();
      expect(screen.getByTestId("travel-section")).toBeInTheDocument();
    });

    it("should call handleSubmit when the form is submitted", () => {
      renderForm();
      const form = screen.getByPlaceholderText("Event Title").closest("form")!;
      fireEvent.submit(form);
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  // ── Google event locking ─────────

  describe("google event locking", () => {
    it("should show the Google locked banner when isGoogle is true", () => {
      mockHookReturn = { ...defaultHookReturn, isGoogle: true };
      renderForm();
      expect(
        screen.getByText(
          "Locked: Google events must be edited in Google Calendar."
        )
      ).toBeInTheDocument();
    });

    it("should disable the title input when isGoogle is true", () => {
      mockHookReturn = { ...defaultHookReturn, isGoogle: true };
      renderForm();
      expect(screen.getByPlaceholderText("Event Title")).toBeDisabled();
    });

    it("should disable the submit button when isGoogle is true", () => {
      mockHookReturn = { ...defaultHookReturn, isGoogle: true };
      renderForm();
      const submit = screen.getByRole("button", { name: /Create Event/i });
      expect(submit).toBeDisabled();
    });

    it("should not show the delete button when isGoogle is true", () => {
      mockHookReturn = { ...defaultHookReturn, isGoogle: true };
      renderForm({ initialEvent: { id: "ev-1" } });
      expect(screen.queryByText(/Delete/i)).not.toBeInTheDocument();
    });
  });

  // ── Recurring event mode toggle ────

  describe("recurring event mode toggle", () => {
    it("should show mode toggle buttons for recurring non-Google events in edit mode", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        isRecurringEv: true,
        isGoogle: false,
      };
      renderForm({ initialEvent: { id: "ev-1" } });
      expect(screen.getByText("Move Only This Day")).toBeInTheDocument();
      expect(screen.getByText("Edit Entire Series")).toBeInTheDocument();
    });

    it("should not show mode toggle for new events", () => {
      mockHookReturn = { ...defaultHookReturn, isRecurringEv: true };
      renderForm({ initialEvent: null });
      expect(screen.queryByText("Move Only This Day")).not.toBeInTheDocument();
    });

    it("should call setEditMode('single') when Move Only This Day is clicked", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        isRecurringEv: true,
        isGoogle: false,
        setEditMode: mockSetEditMode,
      };
      renderForm({ initialEvent: { id: "ev-1" } });
      fireEvent.click(screen.getByText("Move Only This Day"));
      expect(mockSetEditMode).toHaveBeenCalledWith("single");
    });

    it("should call setEditMode('series') when Edit Entire Series is clicked", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        isRecurringEv: true,
        isGoogle: false,
        setEditMode: mockSetEditMode,
      };
      renderForm({ initialEvent: { id: "ev-1" } });
      fireEvent.click(screen.getByText("Edit Entire Series"));
      expect(mockSetEditMode).toHaveBeenCalledWith("series");
    });
  });

  // ── Recurrence section ───

  describe("recurrence section", () => {
    it("should show the repeat select in series edit mode for non-Google events", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        isGoogle: false,
        editMode: "series",
      };
      renderForm();
      expect(screen.getByDisplayValue("Does not repeat")).toBeInTheDocument();
    });

    it("should not show repeat select in single edit mode", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        editMode: "single",
        isGoogle: false,
      };
      renderForm();
      expect(
        screen.queryByDisplayValue("Does not repeat")
      ).not.toBeInTheDocument();
    });

    it("should show weekday checkboxes when recurrenceType is 'weekly'", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        recurrenceType: "weekly",
        editMode: "series",
        isGoogle: false,
      };
      renderForm();
      expect(screen.getByText("Mon")).toBeInTheDocument();
      expect(screen.getByText("Fri")).toBeInTheDocument();
    });

    it("should not show weekday checkboxes for daily recurrence", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        recurrenceType: "daily",
        editMode: "series",
        isGoogle: false,
      };
      renderForm();
      expect(screen.queryByText("Mon")).not.toBeInTheDocument();
    });

    it("should show Until label when recurrenceType is not 'none'", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        recurrenceType: "daily",
        editMode: "series",
        isGoogle: false,
      };
      renderForm();
      expect(screen.getByText("Until")).toBeInTheDocument();
    });

    it("should call setRecurrenceType when the select changes", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        editMode: "series",
        isGoogle: false,
        setRecurrenceType: mockSetRecurrenceType,
      };
      renderForm();
      fireEvent.change(screen.getByDisplayValue("Does not repeat"), {
        target: { value: "weekly" },
      });
      expect(mockSetRecurrenceType).toHaveBeenCalledWith("weekly");
    });
  });

  // ── Submit button 

  describe("submit button", () => {
    it("should show 'Create Event' for a new event", () => {
      renderForm({ initialEvent: null });
      expect(screen.getByText("Create Event")).toBeInTheDocument();
    });

    it("should show 'Update Series' for an existing event in series mode", () => {
      mockHookReturn = { ...defaultHookReturn, editMode: "series" };
      renderForm({ initialEvent: { id: "ev-1" } });
      expect(screen.getByText("Update Series")).toBeInTheDocument();
    });

    it("should show 'Update Only This Day' for single edit mode", () => {
      mockHookReturn = { ...defaultHookReturn, editMode: "single" };
      renderForm({ initialEvent: { id: "ev-1" } });
      expect(screen.getByText("Update Only This Day")).toBeInTheDocument();
    });

    it("should show 'Calculating Travel...' when isCalculating is true", () => {
      mockHookReturn = { ...defaultHookReturn, isCalculating: true };
      renderForm();
      expect(screen.getByText("Calculating Travel...")).toBeInTheDocument();
    });

    it("should disable the submit button when isCalculating is true", () => {
      mockHookReturn = { ...defaultHookReturn, isCalculating: true };
      renderForm();
      const submit = screen.getByRole("button", { name: /Calculating Travel/i });
      expect(submit).toBeDisabled();
    });
  });

  // ── Delete button 

  describe("delete button", () => {
    it("should show 'Delete Entire Event' for an existing non-Google event in series mode", () => {
      mockHookReturn = { ...defaultHookReturn, editMode: "series" };
      renderForm({ initialEvent: { id: "ev-1" } });
      expect(screen.getByText("Delete Entire Event")).toBeInTheDocument();
    });

    it("should not show delete button for a new event", () => {
      renderForm({ initialEvent: null });
      expect(screen.queryByText(/Delete/i)).not.toBeInTheDocument();
    });

    it("should show 'Delete This Day Only' in single edit mode", () => {
      mockHookReturn = { ...defaultHookReturn, editMode: "single" };
      renderForm({ initialEvent: { id: "ev-1" } });
      expect(screen.getByText("Delete This Day Only")).toBeInTheDocument();
    });

    it("should call handleDelete with onSuccess when the delete button is clicked", () => {
      const onSuccess = jest.fn();
      mockHookReturn = {
        ...defaultHookReturn,
        editMode: "series",
        handleDelete: mockHandleDelete,
      };
      renderForm({ initialEvent: { id: "ev-1" }, onSuccess });
      fireEvent.click(screen.getByText("Delete Entire Event"));
      expect(mockHandleDelete).toHaveBeenCalledWith(onSuccess);
    });
  });

    // ── submitBtnClass branch coverage ─
  describe("submit button class", () => {
    it("applies indigo class for series edit mode non-Google non-calculating", () => {
      mockHookReturn = { ...defaultHookReturn, editMode: "series", isGoogle: false, isCalculating: false };
      renderForm({ initialEvent: { id: "ev-1" } });
      const btn = screen.getByRole("button", { name: "Update Series" });
      expect(btn.className).toContain("bg-indigo-600");
    });

    it("applies amber class for single edit mode", () => {
      mockHookReturn = { ...defaultHookReturn, editMode: "single", isGoogle: false, isCalculating: false };
      renderForm({ initialEvent: { id: "ev-1" } });
      const btn = screen.getByRole("button", { name: "Update Only This Day" });
      expect(btn.className).toContain("bg-amber-500");
    });

    it("applies locked class when isGoogle is true", () => {
      mockHookReturn = { ...defaultHookReturn, isGoogle: true };
      renderForm();
      const btn = screen.getByRole("button", { name: "Create Event" });
      expect(btn.className).toContain("bg-white/10");
    });

    it("applies calculating class when isCalculating is true", () => {
      mockHookReturn = { ...defaultHookReturn, isCalculating: true, isGoogle: false };
      renderForm();
      const btn = screen.getByRole("button", { name: /Calculating Travel/ });
      expect(btn.className).toContain("bg-white/20");
    });
  });

  // ── Date/time input onChange handlers ─────────
  describe("date and time inputs", () => {
    it("should call setStartDate when start date changes", () => {
      renderForm();
      const dateInputs = screen.getAllByDisplayValue("2024-06-03");
      fireEvent.change(dateInputs[0], { target: { value: "2024-07-01" } });
      expect(mockSetStartDate).toHaveBeenCalledWith("2024-07-01");
    });

    it("should call setStartTime when start time changes", () => {
      renderForm();
      const timeInputs = screen.getAllByDisplayValue("10:00");
      fireEvent.change(timeInputs[0], { target: { value: "09:00" } });
      expect(mockSetStartTime).toHaveBeenCalledWith("09:00");
    });

    it("should call setEndDate when end date changes", () => {
      renderForm();
      const dateInputs = screen.getAllByDisplayValue("2024-06-03");
      fireEvent.change(dateInputs[1], { target: { value: "2024-07-02" } });
      expect(mockSetEndDate).toHaveBeenCalledWith("2024-07-02");
    });

    it("should call setEndTime when end time changes", () => {
      renderForm();
      const timeInputs = screen.getAllByDisplayValue("11:00");
      fireEvent.change(timeInputs[0], { target: { value: "12:00" } });
      expect(mockSetEndTime).toHaveBeenCalledWith("12:00");
    });
  });

  // ── Recurrence checkbox and until input ───────
  describe("recurrence inputs", () => {
    it("should call setRecurrenceUntil when the until date changes", () => {
      mockHookReturn = {
        ...defaultHookReturn,
        recurrenceType: "daily",
        editMode: "series",
        isGoogle: false,
        setRecurrenceUntil: mockSetRecurrenceUntil,
      };
      renderForm();
      const untilInput = screen.getAllByDisplayValue("").find(
        (el) => el.getAttribute("type") === "date"
      )!;
      fireEvent.change(untilInput, { target: { value: "2024-12-31" } });
      expect(mockSetRecurrenceUntil).toHaveBeenCalledWith("2024-12-31");
    });
  });

  // ── Category buttons disabled when isGoogle ────
  describe("category buttons when google locked", () => {
    it("should disable all category buttons when isGoogle is true", () => {
      mockHookReturn = { ...defaultHookReturn, isGoogle: true };
      renderForm();
      const lectureBtn = screen.getByText("Lecture").closest("button")!;
      expect(lectureBtn).toBeDisabled();
    });
  });
});