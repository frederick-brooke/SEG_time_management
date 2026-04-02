import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormField, Toggle, DayPicker, RecurrencePanel } from "../FormComponents"; 

describe("Shared Form Components", () => {
  // FormField: Validates label rendering and slot projection
  describe("FormField", () => {
    it("renders the label text accurately", () => {
      render(
        <FormField label="Email Address">
          <input type="email" placeholder="test@example.com" />
        </FormField>
      );
      expect(screen.getByText("Email Address")).toBeInTheDocument();
    });

    it("projects its children into the component correctly", () => {
      render(
        <FormField label="Username">
          <input type="text" data-testid="child-input" />
        </FormField>
      );
      expect(screen.getByTestId("child-input")).toBeInTheDocument();
    });
  });

  // Toggle: Tests accessibility, state-based styling, and interaction
  describe("Toggle", () => {
    it("renders the toggle label correctly", () => {
      render(<Toggle label="Enable Notifications" on={false} onToggle={jest.fn()} />);
      expect(screen.getByText("Enable Notifications")).toBeInTheDocument();
    });

    it("reflects the 'on' state via ARIA attributes and classes", () => {
      const { rerender } = render(<Toggle label="Status" on={true} onToggle={jest.fn()} />);
      const toggle = screen.getByRole("switch");
      
      expect(toggle).toHaveAttribute("aria-checked", "true");
      expect(toggle).toHaveClass("bg-indigo-600");

      rerender(<Toggle label="Status" on={false} onToggle={jest.fn()} />);
      expect(toggle).toHaveAttribute("aria-checked", "false");
      expect(toggle).toHaveClass("bg-gray-200");
    });

    it("triggers onToggle when the switch or label is clicked", async () => {
      const user = userEvent.setup();
      const mockOnToggle = jest.fn();
      render(<Toggle label="Click Me" on={false} onToggle={mockOnToggle} />);
      
      // Click the switch
      await user.click(screen.getByRole("switch"));
      // Click the label text
      await user.click(screen.getByText("Click Me"));
      
      expect(mockOnToggle).toHaveBeenCalledTimes(2);
    });
  });

  // DayPicker: Validates selection logic and grid rendering
  describe("DayPicker", () => {
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    it("renders all seven day options", () => {
      render(<DayPicker selected={[]} onChange={jest.fn()} />);
      DAYS.forEach((day) => {
        expect(screen.getByRole("button", { name: day })).toBeInTheDocument();
      });
    });

    it("applies active styling to selected days", () => {
      render(<DayPicker selected={["Mon"]} onChange={jest.fn()} />);
      expect(screen.getByRole("button", { name: "Mon" })).toHaveClass("bg-indigo-600");
      expect(screen.getByRole("button", { name: "Tue" })).toHaveClass("bg-white");
    });

    it("updates selection when a day is clicked", async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      // Test Adding
      const { rerender } = render(<DayPicker selected={["Mon"]} onChange={mockOnChange} />);
      await user.click(screen.getByRole("button", { name: "Wed" }));
      expect(mockOnChange).toHaveBeenCalledWith(["Mon", "Wed"]);

      // Test Removing
      rerender(<DayPicker selected={["Mon", "Wed"]} onChange={mockOnChange} />);
      await user.click(screen.getByRole("button", { name: "Mon" }));
      expect(mockOnChange).toHaveBeenCalledWith(["Wed"]);
    });
  });

  // RecurrencePanel: Tests conditional logic and integration of sub-components
  describe("RecurrencePanel", () => {
    const baseProps = {
      type: "daily",
      days: [],
      until: "2024-12-31",
      onType: jest.fn(),
      onDays: jest.fn(),
      onUntil: jest.fn(),
    };

    beforeEach(() => jest.clearAllMocks());

    it("displays correct initial values for type and date", () => {
      render(<RecurrencePanel {...baseProps} />);
      expect(screen.getByRole("option", { name: "Daily" })).toBeInTheDocument();
      expect(screen.getByLabelText(/until/i)).toHaveValue("2024-12-31");
    });

    it("triggers onUntil when the end date is modified", async () => {
      const user = userEvent.setup();
      render(<RecurrencePanel {...baseProps} />);
      const dateInput = screen.getByLabelText(/until/i);
      
      fireEvent.change(dateInput, { target: { value: "2025-01-01" } });
      expect(baseProps.onUntil).toHaveBeenCalledWith("2025-01-01");
    });

    it("toggles DayPicker visibility based on the recurrence type", () => {
      const { rerender } = render(<RecurrencePanel {...baseProps} type="daily" />);
      expect(screen.queryByRole("button", { name: "Mon" })).not.toBeInTheDocument();

      rerender(<RecurrencePanel {...baseProps} type="weekly" />);
      expect(screen.getByRole("button", { name: "Mon" })).toBeInTheDocument();
    });
  });
});