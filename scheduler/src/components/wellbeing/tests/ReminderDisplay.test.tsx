import { render, screen, fireEvent } from "@testing-library/react";
import ReminderContainer from "../ReminderDisplay";

// Mock UI context
const mockSetWellbeingOpen = jest.fn();
jest.mock("@/context/UIContext", () => ({
  useUI: () => ({
    setWellbeingOpen: mockSetWellbeingOpen,
  }),
}));

// Mock useReminders hook
let mockReminder: any;
let capturedOnFire: any;

jest.mock("hooks/useReminders", () => ({
  useReminders: (config: any) => {
    capturedOnFire = config.onFire;
    return mockReminder;
  },
}));

// Mock UI components
jest.mock("@/components/ui/glassCard", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/Button", () => ({
  Button: ({ children, ...props }: any) => (
    <Button {...props}>{children}</Button>
  ),
}));

jest.mock("@/components/ui/reminderModal", () => ({
  __esModule: true,
  default: ({ open, title, children, onClose }: any) =>
    open ? (
      <div>
        <h1>{title}</h1>
        {children}
        <Button onClick={onClose}>close</Button>
      </div>
    ) : null,
}));

jest.mock("../reminder_timer_picker", () => ({
  __esModule: true,
  default: ({ onConfirm }: any) => (
    <Button onClick={() => onConfirm(5000)}>confirm</Button>
  ),
}));

//Helpers 
const defaultProps = {
  id: "test",
  iconOn: <span>ON</span>,
  iconOff: <span>OFF</span>,
  settingsTitle: "Settings",
  settingsText: "Set your timer",
  firedTitle: "Fired",
  firedText: "Time's up",
};

describe("ReminderContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockReminder = {
      enabled: false,
      remainingMs: null,
      durationMs: null,
      toggleReminder: jest.fn(),
      setDurationMs: jest.fn(),
    };
  });

  it("opens settings modal when no duration and toggle clicked", () => {
    render(<ReminderContainer {...defaultProps} />);

    fireEvent.click(screen.getByText("OFF"));

    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("calls toggleReminder if duration exists", () => {
    mockReminder.durationMs = 1000;

    render(<ReminderContainer {...defaultProps} />);

    fireEvent.click(screen.getByText("OFF"));

    expect(mockReminder.toggleReminder).toHaveBeenCalled();
  });

  it("opens settings modal via settings button", () => {
    render(<ReminderContainer {...defaultProps} />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("closes settings modal and sets duration", () => {
    render(<ReminderContainer {...defaultProps} />);

    fireEvent.click(screen.getByRole("button")); // open

    fireEvent.click(screen.getByText("confirm"));

    expect(mockReminder.setDurationMs).toHaveBeenCalledWith(5000);
    expect(mockSetWellbeingOpen).toHaveBeenCalledWith(true);
  });

  it("closes settings modal on close button", () => {
    render(<ReminderContainer {...defaultProps} />);

    fireEvent.click(screen.getByRole("button"));

    fireEvent.click(screen.getByText("close"));

    expect(mockSetWellbeingOpen).toHaveBeenCalledWith(true);
  });

  it("shows countdown when enabled", () => {
    mockReminder.enabled = true;
    mockReminder.remainingMs = 3661000; // 01:01:01

    render(<ReminderContainer {...defaultProps} />);

    expect(screen.getByText("01:01:01")).toBeInTheDocument();
  });

  it("does not show countdown when disabled", () => {
    render(<ReminderContainer {...defaultProps} />);

    expect(screen.queryByText(/:/)).not.toBeInTheDocument();
  });

  it("formats null time correctly", () => {
    mockReminder.enabled = true;
    mockReminder.remainingMs = null;

    render(<ReminderContainer {...defaultProps} />);

    expect(screen.queryByText("--:--:--")).not.toBeInTheDocument();
  });
});