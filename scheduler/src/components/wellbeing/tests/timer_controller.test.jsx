import { render, screen, fireEvent, act } from "@testing-library/react";
import TimerController from "../timer_controller";

// mock UI context
const mockSetWellbeingOpen = jest.fn();

jest.mock("@/context/UIContext", () => ({
  useUI: () => ({
    wellbeingOpen: true,
    setWellbeingOpen: mockSetWellbeingOpen,
  }),
}));

// Mock Modal
jest.mock("components/ui/modal", () => ({
  __esModule: true,
  default: ({ open, children, title, onClose }) =>
    open ? (
      <div>
        <div>{title}</div>
        {children}
        <button onClick={onClose}>CloseModal</button>
      </div>
    ) : null,
}));

// Mock Timer
let mockOnTick;

jest.mock("components/wellbeing/timer", () => ({
  __esModule: true,
  default: ({ onTick }) => {
    mockOnTick = onTick;
    return <div>MockTimer</div>;
  },
}));


describe("TimerController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not show modal initially", () => {
    render(<TimerController />);
    expect(screen.queryByText("Break time")).not.toBeInTheDocument();
  });

  test("shows modal when reminder threshold is reached", () => {
    render(<TimerController />);

    // Simulate reminderAtTime being set internally
    // Since it's null by default, we simulate tick <= null (0 <= null is true)
    act(() => {
        mockOnTick(0);
    });

    expect(screen.getByText("Break time")).toBeInTheDocument();
    expect(mockSetWellbeingOpen).toHaveBeenCalledWith(false);
  });

  test("fires only once", () => {
    render(<TimerController />);

    act(() => {
        mockOnTick(0);
    }); // first fire

    act(() => {
        mockOnTick(0);
    }); // second attempt

    expect(mockSetWellbeingOpen).toHaveBeenCalledTimes(1);
  });

  test("closes modal correctly", () => {
    render(<TimerController />);

    act(() => {
        mockOnTick(0);
    });

    fireEvent.click(screen.getByText("CloseModal"));

    expect(screen.queryByText("Break time")).not.toBeInTheDocument();
    expect(mockSetWellbeingOpen).toHaveBeenCalledWith(true);
  });
});