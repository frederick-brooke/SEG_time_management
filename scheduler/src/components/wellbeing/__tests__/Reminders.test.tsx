import React from "react";
import { render, screen } from "@testing-library/react";
import Reminders from "../Reminders";

jest.mock("../ReminderDisplay", () =>
  jest.fn(({ id, settingsTitle, settingsText, firedTitle, firedText }: {
    id: string;
    settingsTitle: string;
    settingsText: string;
    firedTitle: string;
    firedText: string;
    iconOn: React.ReactNode;
    iconOff: React.ReactNode;
  }) => (
    <div data-testid={`reminder-${id}`}>
      <span>{settingsTitle}</span>
      <span>{settingsText}</span>
      <span>{firedTitle}</span>
      <span>{firedText}</span>
    </div>
  ))
);

jest.mock("@tabler/icons-react", () => ({
  IconLock: () => <svg data-testid="icon-lock" />,
  IconLockOff: () => <svg data-testid="icon-lock-off" />,
  IconDroplet: ({ className }: { className: string }) => (
    <svg data-testid="icon-droplet" className={className} />
  ),
}));

import ReminderDisplay from "../ReminderDisplay";

const mockReminderContainer = jest.mocked(ReminderDisplay);

const defaultProps = {
  isRunning: false,
  remainingMs: 0,
  setReminderOffsetMs: jest.fn(),
  reminderFired: null,
};

describe("Reminders", () => {
  beforeEach(() => {
    mockReminderContainer.mockClear();
  });

  it("renders the outer container with correct classes", () => {
    const { container } = render(<Reminders {...defaultProps} />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("flex", "p-10", "flex-col", "gap-4");
  });

  it("renders the water ReminderContainer with correct text props", () => {
    render(<Reminders {...defaultProps} />);
    expect(screen.getByTestId("reminder-water")).toBeInTheDocument();
    expect(screen.getByText("Water Reminder")).toBeInTheDocument();
    expect(screen.getByText("How often should I remind you to drink water?")).toBeInTheDocument();
    expect(screen.getByText("Hydration Time")).toBeInTheDocument();
    expect(screen.getByText("Time to drink a glass of water!")).toBeInTheDocument();
  });

  it("passes iconOn as an IconDroplet element with correct className", () => {
    render(<Reminders {...defaultProps} />);
    const { iconOn } = mockReminderContainer.mock.calls[0][0];
    const { container: c } = render(iconOn as React.ReactElement);
    expect(c.querySelector("[data-testid='icon-droplet']")).toHaveClass("w-5", "h-5");
  });

  it("passes iconOff as an IconDroplet element with correct className", () => {
    render(<Reminders {...defaultProps} />);
    const { iconOff } = mockReminderContainer.mock.calls[0][0];
    const { container: c } = render(iconOff as React.ReactElement);
    expect(c.querySelector("[data-testid='icon-droplet']")).toHaveClass("w-5", "h-5");
  });

  it("renders with isRunning true", () => {
    render(<Reminders {...defaultProps} isRunning={true} />);
    expect(screen.getByTestId("reminder-water")).toBeInTheDocument();
  });

  it("renders with a non-zero remainingMs", () => {
    render(<Reminders {...defaultProps} remainingMs={5000} />);
    expect(screen.getByTestId("reminder-water")).toBeInTheDocument();
  });

  it("renders with reminderFired as true", () => {
    render(<Reminders {...defaultProps} reminderFired={true} />);
    expect(screen.getByTestId("reminder-water")).toBeInTheDocument();
  });

  it("renders with reminderFired as false", () => {
    render(<Reminders {...defaultProps} reminderFired={false} />);
    expect(screen.getByTestId("reminder-water")).toBeInTheDocument();
  });

  it("does not call setReminderOffsetMs on render", () => {
    const mockSetter = jest.fn();
    render(<Reminders {...defaultProps} setReminderOffsetMs={mockSetter} />);
    expect(mockSetter).not.toHaveBeenCalled();
  });
});