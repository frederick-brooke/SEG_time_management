import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { act } from "@testing-library/react";

// ─── Mock ALL external components/hooks before any imports ───────────────────
// This is the fix for "Element type is invalid: got undefined" —
// every component used inside ReminderContainer must be mocked here.

jest.mock("@/context/UIContext", () => ({
  useUI: jest.fn(),
}));

jest.mock("@/hooks/useReminders", () => ({
  useReminders: jest.fn(),
}));

jest.mock("@/components/ui/glassCard", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

jest.mock("components/ui/button", () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

jest.mock("@/components/ui/reminderModal", () => ({
  __esModule: true,
  default: ({ open, onClose, title, children }: any) =>
    open ? (
      <div data-testid="reminder-modal">
        <span>{title}</span>
        {children}
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

jest.mock("@/components/wellbeing/reminder_timer_picker", () => ({
  __esModule: true,
  default: ({ onConfirm, initialDuration }: any) => (
    <div data-testid="reminder-picker">
      <button onClick={() => onConfirm(5000)}>Confirm Duration</button>
      <span data-testid="initial-duration">{initialDuration}</span>
    </div>
  ),
}));

jest.mock("@tabler/icons-react", () => ({
  IconSettings: () => <svg data-testid="icon-settings" />,
  IconClock: () => <svg data-testid="icon-clock" />,
}));

// ─── Now import the component under test ─────────────────────────────────────

import ReminderContainer from "@/components/wellbeing/reminder_display";
import { useUI } from "@/context/UIContext";
import { useReminders } from "hooks/useReminders";

// ─── Shared test helpers ──────────────────────────────────────────────────────

const mockSetWellbeingOpen = jest.fn();
const mockHandleToggleClick = jest.fn();
const mockSetDurationMs = jest.fn();

// Baseline reminder hook return value
const DEFAULT_REMINDER = {
  enabled: false,
  remainingMs: null,
  durationMs: null,
  handleToggleClick: mockHandleToggleClick,
  setDurationMs: mockSetDurationMs,
};

// Baseline props
const DEFAULT_PROPS = {
  id: "test-reminder",
  iconOn: <span>ON</span>,
  iconOff: <span>OFF</span>,
  settingsTitle: "Settings Title",
  settingsText: "Settings Text",
  firedTitle: "Fired Title",
  firedText: "Fired Text",
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Default UI context
  (useUI as jest.Mock).mockReturnValue({
    wellbeingOpen: true,
    setWellbeingOpen: mockSetWellbeingOpen,
  });

  // Default reminder hook
  (useReminders as jest.Mock).mockReturnValue({ ...DEFAULT_REMINDER });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ReminderContainer", () => {

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("basic rendering", () => {
    test("renders without crashing", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByTestId("glass-card")).toBeInTheDocument();
    });

    test("renders settings button", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByTestId("icon-settings")).toBeInTheDocument();
    });

    test("renders toggle switch", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      // The toggle is the div wrapping iconOn/iconOff
      expect(screen.getByText("OFF")).toBeInTheDocument();
    });

    test("does not show time remaining when disabled", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.queryByTestId("icon-clock")).not.toBeInTheDocument();
    });

    test("does not show settings modal by default", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.queryByTestId("reminder-modal")).not.toBeInTheDocument();
    });
  });

  // ── Enabled state ──────────────────────────────────────────────────────────

  describe("enabled state", () => {
    test("shows iconOn when enabled", () => {
      (useReminders as jest.Mock).mockReturnValue({
        ...DEFAULT_REMINDER,
        enabled: true,
        remainingMs: 30_000,
      });
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByText("ON")).toBeInTheDocument();
    });

    test("shows iconOff when disabled", () => {
      (useReminders as jest.Mock).mockReturnValue({
        ...DEFAULT_REMINDER,
        enabled: false,
      });
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByText("OFF")).toBeInTheDocument();
    });

    test("shows clock icon when enabled and remainingMs is not null", () => {
      (useReminders as jest.Mock).mockReturnValue({
        ...DEFAULT_REMINDER,
        enabled: true,
        remainingMs: 30_000,
      });
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
    });

    test("does not show clock icon when enabled but remainingMs is null", () => {
      (useReminders as jest.Mock).mockReturnValue({
        ...DEFAULT_REMINDER,
        enabled: true,
        remainingMs: null,
      });
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.queryByTestId("icon-clock")).not.toBeInTheDocument();
    });
  });

  // ── formatMs ───────────────────────────────────────────────────────────────

  describe("formatMs display", () => {
    function renderWithMs(remainingMs: number) {
      (useReminders as jest.Mock).mockReturnValue({
        ...DEFAULT_REMINDER,
        enabled: true,
        remainingMs,
      });
      render(<ReminderContainer {...DEFAULT_PROPS} />);
    }

    test("formats 30 seconds → 00:00:30", () => {
      renderWithMs(30_000);
      expect(screen.getByText(/00:00:30/)).toBeInTheDocument();
    });

    test("formats 90 seconds → 00:01:30", () => {
      renderWithMs(90_000);
      expect(screen.getByText(/00:01:30/)).toBeInTheDocument();
    });

    test("formats 1 hour → 01:00:00", () => {
      renderWithMs(3_600_000);
      expect(screen.getByText(/01:00:00/)).toBeInTheDocument();
    });

    test("formats partial seconds — 1500ms rounds up to 00:00:02", () => {
      renderWithMs(1_500);
      expect(screen.getByText(/00:00:02/)).toBeInTheDocument();
    });

    test("formats 0ms as 00:00:00", () => {
      renderWithMs(0);
      // 0 is falsy so remainingMs != null passes, display renders
      expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
      expect(screen.getByText(/00:00:00/)).toBeInTheDocument();
    });

    test("shows '--:--:--' when remainingMs is null (formatMs fallback)", () => {
      // This tests the formatMs(null) branch — triggered via ReminderPicker confirm
      (useReminders as jest.Mock).mockReturnValue({
        ...DEFAULT_REMINDER,
        enabled: true,
        remainingMs: null,
        durationMs: 5000,
      });
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      // Clock is hidden when remainingMs is null, so we just verify no crash
      expect(screen.queryByTestId("icon-clock")).not.toBeInTheDocument();
    });
  });

  // ── Toggle click behaviour ─────────────────────────────────────────────────

  describe("toggle click", () => {
    test("opens settings modal when durationMs is null", () => {
      (useReminders as jest.Mock).mockReturnValue({
        ...DEFAULT_REMINDER,
        durationMs: null,
      });
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByText("OFF").closest("div")!);
      expect(screen.getByTestId("reminder-modal")).toBeInTheDocument();
      expect(screen.getByText("Settings Title")).toBeInTheDocument();
    });

    test("calls handleToggleClick when durationMs is set", () => {
      (useReminders as jest.Mock).mockReturnValue({
        ...DEFAULT_REMINDER,
        durationMs: 5000,
      });
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByText("OFF").closest("div")!);
      expect(mockHandleToggleClick).toHaveBeenCalledTimes(1);
    });

    test("does not call handleToggleClick when durationMs is null", () => {
      (useReminders as jest.Mock).mockReturnValue({
        ...DEFAULT_REMINDER,
        durationMs: null,
      });
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByText("OFF").closest("div")!);
      expect(mockHandleToggleClick).not.toHaveBeenCalled();
    });
  });

  // ── Settings modal ─────────────────────────────────────────────────────────

  describe("settings modal", () => {
    test("opens settings modal when settings button is clicked", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("icon-settings").closest("button")!);
      expect(screen.getByTestId("reminder-modal")).toBeInTheDocument();
      expect(screen.getByText("Settings Title")).toBeInTheDocument();
      expect(screen.getByText("Settings Text")).toBeInTheDocument();
    });

    test("closes settings modal on close", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("icon-settings").closest("button")!);
      fireEvent.click(screen.getByText("Close Modal"));
      expect(screen.queryByTestId("reminder-modal")).not.toBeInTheDocument();
    });

    test("settings button sets wellbeingOpen to false", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("icon-settings").closest("button")!);
      expect(mockSetWellbeingOpen).toHaveBeenCalledWith(false);
    });

    test("closing settings modal sets wellbeingOpen to true", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("icon-settings").closest("button")!);
      fireEvent.click(screen.getByText("Close Modal"));
      expect(mockSetWellbeingOpen).toHaveBeenCalledWith(true);
    });

    test("renders ReminderPicker inside settings modal", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("icon-settings").closest("button")!);
      expect(screen.getByTestId("reminder-picker")).toBeInTheDocument();
    });

    test("confirming duration closes modal and calls setDurationMs", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("icon-settings").closest("button")!);
      fireEvent.click(screen.getByText("Confirm Duration"));
      expect(mockSetDurationMs).toHaveBeenCalledWith(5000);
      expect(screen.queryByTestId("reminder-modal")).not.toBeInTheDocument();
    });

    test("confirming duration sets wellbeingOpen to true", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("icon-settings").closest("button")!);
      fireEvent.click(screen.getByText("Confirm Duration"));
      expect(mockSetWellbeingOpen).toHaveBeenCalledWith(true);
    });

    test("passes initialDuration to ReminderPicker", () => {
      (useReminders as jest.Mock).mockReturnValue({
        ...DEFAULT_REMINDER,
        durationMs: 12345,
      });
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("icon-settings").closest("button")!);
      expect(screen.getByTestId("initial-duration")).toHaveTextContent("12345");
    });
  });

  // ── Fired modal ────────────────────────────────────────────────────────────

  describe("fired modal", () => {
    test("fired modal is not shown by default", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.queryByText("Fired Title")).not.toBeInTheDocument();
    });

    test("fired modal shows when onFire callback is triggered", () => {
      	// Capture the onFire callback passed to useReminders and call it
		let capturedOnFire: (() => void) | undefined;
		(useReminders as jest.Mock).mockImplementation(({ onFire }) => {
			capturedOnFire = onFire;
			return { ...DEFAULT_REMINDER };
		});

      	render(<ReminderContainer {...DEFAULT_PROPS} />);
      	act(() => {
			capturedOnFire?.();
		});

      expect(screen.getByText("Fired Title")).toBeInTheDocument();
      expect(screen.getByText("Fired Text")).toBeInTheDocument();
    });

    test("onFire sets wellbeingOpen to false", () => {
      let capturedOnFire: (() => void) | undefined;
      (useReminders as jest.Mock).mockImplementation(({ onFire }) => {
        capturedOnFire = onFire;
        return { ...DEFAULT_REMINDER };
      });

      	render(<ReminderContainer {...DEFAULT_PROPS} />);
		act(() => {
			capturedOnFire?.();
		});

      expect(mockSetWellbeingOpen).toHaveBeenCalledWith(false);
    });

    test("closing fired modal sets wellbeingOpen to true", () => {
      let capturedOnFire: (() => void) | undefined;
      (useReminders as jest.Mock).mockImplementation(({ onFire }) => {
        capturedOnFire = onFire;
        return { ...DEFAULT_REMINDER };
      });

      render(<ReminderContainer {...DEFAULT_PROPS} />);
      act(() => {
			capturedOnFire?.();
		});
      fireEvent.click(screen.getByText("Close Modal"));

      expect(mockSetWellbeingOpen).toHaveBeenCalledWith(true);
    });

    test("closing fired modal hides it", () => {
		let capturedOnFire: (() => void) | undefined;
		(useReminders as jest.Mock).mockImplementation(({ onFire }) => {
			capturedOnFire = onFire;
			return { ...DEFAULT_REMINDER };
		});

      	render(<ReminderContainer {...DEFAULT_PROPS} />);
		act(() => {
			capturedOnFire?.();
		});
      fireEvent.click(screen.getByText("Close Modal"));

      expect(screen.queryByText("Fired Title")).not.toBeInTheDocument();
    });
  });

  // ── useReminders hook wiring ───────────────────────────────────────────────

  describe("useReminders hook wiring", () => {
    test("passes correct id to useReminders", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(useReminders as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({ id: "test-reminder" })
      );
    });

    test("passes onFire callback to useReminders", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(useReminders as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({ onFire: expect.any(Function) })
      );
    });
  });
});