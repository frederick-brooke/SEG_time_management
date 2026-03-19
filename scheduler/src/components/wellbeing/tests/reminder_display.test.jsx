// src/components/wellbeing/tests/reminder_display.test.jsx
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ReminderContainer from "../reminder_display";

// ─────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────

const mockSetWellbeingOpen  = jest.fn();
const mockHandleToggleClick = jest.fn();
const mockSetDurationMs     = jest.fn();

// 1. UIContext
jest.mock("@/context/UIContext", () => ({
  useUI: () => ({
    wellbeingOpen:    true,
    setWellbeingOpen: mockSetWellbeingOpen,
  }),
}));

// 2. useReminders — capture onFire so tests can trigger it
let capturedOnFire;
let mockReminderReturn;

jest.mock("hooks/useReminders", () => ({
  useReminders: ({ onFire }) => {
    capturedOnFire = onFire;
    return mockReminderReturn;
  },
}));

// 3. ReminderModal — renders children + a labelled close button when open
jest.mock("@/components/ui/reminderModal", () => ({
  __esModule: true,
  default: ({ open, onClose, title, children }) =>
    open ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
        <button onClick={onClose}>CloseModal</button>
      </div>
    ) : null,
}));

// 4. ReminderPicker — expose a confirm button that calls onConfirm(60000)
let capturedOnConfirm;
jest.mock("../reminder_timer_picker", () => ({
  __esModule: true,
  default: ({ onConfirm, initialDuration }) => {
    capturedOnConfirm = onConfirm;
    return (
      <button data-testid="picker-confirm" onClick={() => onConfirm(60_000)}>
        ConfirmPicker
      </button>
    );
  },
}));

// 5. Button — plain passthrough so we can click it
jest.mock("components/ui/button", () => ({
  Button: ({ onClick, children, ...rest }) => (
    <button data-testid="settings-btn" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

// 6. Icon — lightweight stub
jest.mock("@tabler/icons-react", () => ({
  IconSettings: () => <span data-testid="icon-settings" />,
}));

// ─────────────────────────────────────────────
// Default prop values used across tests
// ─────────────────────────────────────────────
const DEFAULT_PROPS = {
  id:            "test-reminder",
  iconOn:        <span>ON</span>,
  iconOff:       <span>OFF</span>,
  settingsTitle: "Set reminder",
  settingsText:  "Choose a time",
  firedTitle:    "Break time!",
  firedText:     "Time to rest",
};

const DEFAULT_REMINDER = {
  durationMs:          null,
  enabled:             false,
  remainingMs:         null,
  handleToggleClick:   mockHandleToggleClick,
  setDurationMs:       mockSetDurationMs,
};

// ─────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────
describe("ReminderContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReminderReturn = { ...DEFAULT_REMINDER };
    capturedOnFire     = undefined;
    capturedOnConfirm  = undefined;
  });

  // ── Render ─────────────────────────────────
  describe("initial render", () => {
    test("renders without crashing", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
    });

    test("renders the settings icon button", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByTestId("settings-btn")).toBeInTheDocument();
    });

    test("toggle shows iconOff when disabled", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByText("OFF")).toBeInTheDocument();
    });

    test("does NOT show the settings modal initially", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    test("does NOT show the fired modal initially", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    test("does NOT show remaining time when disabled", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.queryByText(/Time remaining/i)).not.toBeInTheDocument();
    });
  });

  // ── Toggle (durationMs === null) ───────────
  describe("toggle — no duration set", () => {
    test("opens settings modal when durationMs is null", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByText("OFF").closest("div"));
      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    test("shows settingsTitle in the modal", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByText("OFF").closest("div"));
      expect(screen.getByText("Set reminder")).toBeInTheDocument();
    });

    test("shows settingsText inside the modal", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByText("OFF").closest("div"));
      expect(screen.getByText("Choose a time")).toBeInTheDocument();
    });

    test("does NOT call handleToggleClick when durationMs is null", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByText("OFF").closest("div"));
      expect(mockHandleToggleClick).not.toHaveBeenCalled();
    });
  });

  // ── Toggle (durationMs set) ────────────────
  describe("toggle — duration already set", () => {
    test("calls handleToggleClick when durationMs is not null", () => {
      mockReminderReturn = { ...DEFAULT_REMINDER, durationMs: 60_000 };
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByText("OFF").closest("div"));
      expect(mockHandleToggleClick).toHaveBeenCalledTimes(1);
    });

    test("does NOT open settings modal when durationMs is set", () => {
      mockReminderReturn = { ...DEFAULT_REMINDER, durationMs: 60_000 };
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByText("OFF").closest("div"));
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });
  });

  // ── Settings button ─────────────────────────
  describe("settings button", () => {
    test("opens the settings modal", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("settings-btn"));
      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    test("calls setWellbeingOpen(false) when settings button is clicked", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("settings-btn"));
      expect(mockSetWellbeingOpen).toHaveBeenCalledWith(false);
    });
  });

  // ── Settings modal close ───────────────────
  describe("settings modal — close button", () => {
    test("closes the settings modal when CloseModal is clicked", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("settings-btn"));
      fireEvent.click(screen.getByText("CloseModal"));
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    test("calls setWellbeingOpen(true) when settings modal closes", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("settings-btn"));
      fireEvent.click(screen.getByText("CloseModal"));
      expect(mockSetWellbeingOpen).toHaveBeenCalledWith(true);
    });
  });

  // ── ReminderPicker confirm ─────────────────
  describe("ReminderPicker onConfirm", () => {
    test("calls reminder.setDurationMs with the chosen value", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("settings-btn"));
      fireEvent.click(screen.getByTestId("picker-confirm")); // fires onConfirm(60000)
      expect(mockSetDurationMs).toHaveBeenCalledWith(60_000);
    });

    test("closes the settings modal after confirm", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("settings-btn"));
      fireEvent.click(screen.getByTestId("picker-confirm"));
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    test("calls setWellbeingOpen(true) after confirm", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByTestId("settings-btn"));
      fireEvent.click(screen.getByTestId("picker-confirm"));
      expect(mockSetWellbeingOpen).toHaveBeenCalledWith(true);
    });
  });

  // ── onFire callback ────────────────────────
  describe("onFire callback (reminder fires)", () => {
    test("opens the fired modal when onFire is called", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      act(() => { capturedOnFire(); });
      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    test("shows firedTitle in the fired modal", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      act(() => { capturedOnFire(); });
      expect(screen.getByText("Break time!")).toBeInTheDocument();
    });

    test("shows firedText inside the fired modal", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      act(() => { capturedOnFire(); });
      expect(screen.getByText("Time to rest")).toBeInTheDocument();
    });

    test("calls setWellbeingOpen(false) when reminder fires", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      act(() => { capturedOnFire(); });
      expect(mockSetWellbeingOpen).toHaveBeenCalledWith(false);
    });
  });

  // ── Fired modal close ──────────────────────
  describe("fired modal — close button", () => {
    test("closes the fired modal when CloseModal is clicked", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      act(() => { capturedOnFire(); });
      fireEvent.click(screen.getByText("CloseModal"));
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    test("calls setWellbeingOpen(true) when fired modal closes", () => {
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      act(() => { capturedOnFire(); });
      fireEvent.click(screen.getByText("CloseModal"));
      expect(mockSetWellbeingOpen).toHaveBeenCalledWith(true);
    });
  });

  // ── Enabled state / remaining time ────────
  describe("enabled state with remainingMs", () => {
    test("shows iconOn when enabled", () => {
      mockReminderReturn = { ...DEFAULT_REMINDER, enabled: true, remainingMs: 30_000 };
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByText("ON")).toBeInTheDocument();
    });

    test("shows 'Time remaining' when enabled and remainingMs is not null", () => {
      mockReminderReturn = { ...DEFAULT_REMINDER, enabled: true, remainingMs: 30_000 };
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByText(/Time remaining/i)).toBeInTheDocument();
    });

    test("formats remainingMs correctly — 90 seconds → 00:01:30", () => {
      mockReminderReturn = { ...DEFAULT_REMINDER, enabled: true, remainingMs: 90_000 };
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByText(/00:01:30/)).toBeInTheDocument();
    });

    test("formats remainingMs correctly — 1 hour → 01:00:00", () => {
      mockReminderReturn = { ...DEFAULT_REMINDER, enabled: true, remainingMs: 3_600_000 };
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByText(/01:00:00/)).toBeInTheDocument();
    });

    test("formats remainingMs correctly — partial seconds round up", () => {
      // 1500ms → Math.ceil(1.5) = 2 seconds → 00:00:02
      mockReminderReturn = { ...DEFAULT_REMINDER, enabled: true, remainingMs: 1_500 };
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.getByText(/00:00:02/)).toBeInTheDocument();
    });

    test("hides remaining time when enabled but remainingMs is null", () => {
      mockReminderReturn = { ...DEFAULT_REMINDER, enabled: true, remainingMs: null };
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.queryByText(/Time remaining/i)).not.toBeInTheDocument();
    });

    test("hides remaining time when remainingMs is set but disabled", () => {
      mockReminderReturn = { ...DEFAULT_REMINDER, enabled: false, remainingMs: 30_000 };
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      expect(screen.queryByText(/Time remaining/i)).not.toBeInTheDocument();
    });
  });

  // ── formatMs edge cases ────────────────────
  describe("formatMs — null/zero edge cases", () => {
    // formatMs is only rendered when enabled && remainingMs != null,
    // so null input renders '--:--:--' only if the guard is bypassed.
    // We test the zero case which IS reachable.
    test("formats 0ms as 00:00:00", () => {
      mockReminderReturn = { ...DEFAULT_REMINDER, enabled: true, remainingMs: 0 };
      render(<ReminderContainer {...DEFAULT_PROPS} />);
      // remainingMs === 0 is falsy, so the guard (remainingMs != null) still passes
      // but 0 == null is false in JS, so the display renders
      expect(screen.getByText(/Time remaining/i)).toBeInTheDocument();
      expect(screen.getByText(/00:00:00/)).toBeInTheDocument();
    });
  });
});