import { render, screen, fireEvent } from "@testing-library/react";
import ReminderPicker from "../reminder_timer_picker";

describe("ReminderPicker", () => {
  test("uses default time when initialDuration is null", () => {
    render(<ReminderPicker onConfirm={jest.fn()} initialDuration={null} />);
    
    const input = screen.getByDisplayValue("00:05:00");
    expect(input).toBeInTheDocument();
  });

  test("formats provided initialDuration correctly", () => {
    const duration = (1 * 3600 + 2 * 60 + 3) * 1000;

    render(<ReminderPicker onConfirm={jest.fn()} initialDuration={duration} />);
    
    const input = screen.getByDisplayValue("01:02:03");
    expect(input).toBeInTheDocument();
  });

  test("updates input value when user types", () => {
    render(<ReminderPicker onConfirm={jest.fn()} initialDuration={null} />);
    
    const input = screen.getByDisplayValue("00:05:00") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "00:10:00" } });
    expect(input.value).toBe("00:10:00");
  });

  test("calls onConfirm with correct milliseconds", () => {
    const mockConfirm = jest.fn();

    render(<ReminderPicker onConfirm={mockConfirm} initialDuration={null} />);
    
    const input = screen.getByDisplayValue("00:05:00");
    const button = screen.getByText("Set Time");

    fireEvent.change(input, { target: { value: "01:00:30" } });
    fireEvent.click(button);

    expect(mockConfirm).toHaveBeenCalledWith((3600 + 30) * 1000);
  });

  test("handles missing seconds (HH:MM)", () => {
    const mockConfirm = jest.fn();

    render(<ReminderPicker onConfirm={mockConfirm} initialDuration={null} />);
    
    const input = screen.getByDisplayValue("00:05:00");
    const button = screen.getByText("Set Time");

    fireEvent.change(input, { target: { value: "00:15" } });
    fireEvent.click(button);

    expect(mockConfirm).toHaveBeenCalledWith(15 * 60 * 1000);
  });
});