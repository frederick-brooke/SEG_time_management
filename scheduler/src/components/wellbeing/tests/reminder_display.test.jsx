import { render, screen, fireEvent } from "@testing-library/react";
import ReminderContainer from "../reminder_display";

// ---- Mocks ----

// Mock UI context
const mockSetWellbeingOpen = jest.fn();
jest.mock("@/context/UIContext", () => ({
  useUI: () => ({
    wellbeingOpen: true,
    setWellbeingOpen: mockSetWellbeingOpen,
  }),
}));

// Mock useReminders hook
const mockHandleToggleClick = jest.fn();
const mockSetDurationMs = jest.fn();

let mockReminderState = {
  durationMs: null,
  enabled: false,
  remainingMs: null,
  handleToggleClick: mockHandleToggleClick,
  setDurationMs: mockSetDurationMs,
};

jest.mock("hooks/useReminders", () => ({
  useReminders: () => mockReminderState,
}));

// Mock UI components
jest.mock("components/ui/button", () => ({
  Button: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock("components/ui/modal", () => ({
  __esModule: true,
  default: ({ open, children, title }) =>
    open ? (
      <div>
        <div>{title}</div>
        {children}
      </div>
    ) : null,
}));

jest.mock("../reminder_timer_picker", () => ({
  __esModule: true,
  default: ({ onConfirm }) => (
    <button onClick={() => onConfirm(60000)}>MockConfirm</button>
  ),
}));

describe("ReminderContainer", () => {
    beforeEach(() => {
    jest.clearAllMocks();

    mockReminderState = {
        durationMs: null,
        enabled: false,
        remainingMs: null,
        handleToggleClick: mockHandleToggleClick,
        setDurationMs: mockSetDurationMs,
    };
    });

    test("opens settings when duration is null", () => {
        mockReminderState.durationMs = null;

        render(
        <ReminderContainer
            id="1"
            iconOn="ON"
            iconOff="OFF"
            settingsTitle="Settings"
            settingsText="Set time"
            firedTitle="Done"
            firedText="Finished"
        />
        );

        fireEvent.click(screen.getByText("OFF"));

        expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    test("calls handleToggleClick when duration exists", () => {
        mockReminderState.durationMs = 1000;

        render(
        <ReminderContainer
            id="1"
            iconOn="ON"
            iconOff="OFF"
            settingsTitle="Settings"
            settingsText="Set time"
            firedTitle="Done"
            firedText="Finished"
        />
        );

    fireEvent.click(screen.getByText("OFF"));

    expect(mockHandleToggleClick).toHaveBeenCalled();
  });

  test("shows remaining time when enabled", () => {
    mockReminderState.enabled = true;
    mockReminderState.remainingMs = 5000;

    render(
      <ReminderContainer
        id="1"
        iconOn="ON"
        iconOff="OFF"
        settingsTitle="Settings"
        settingsText="Set time"
        firedTitle="Done"
        firedText="Finished"
      />
    );

    expect(screen.getByText(/Time remaining:/)).toBeInTheDocument();
  });

  test("sets duration when ReminderPicker confirms", () => {
    mockReminderState.durationMs = null;

    render(
      <ReminderContainer
        id="1"
        iconOn="ON"
        iconOff="OFF"
        settingsTitle="Settings"
        settingsText="Set time"
        firedTitle="Done"
        firedText="Finished"
      />
    );

    // open settings
    fireEvent.click(screen.getByText("OFF"));

    // trigger confirm
    fireEvent.click(screen.getByText("MockConfirm"));

    expect(mockSetDurationMs).toHaveBeenCalledWith(60000);
  });
});