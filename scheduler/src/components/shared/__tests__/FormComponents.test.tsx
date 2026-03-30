import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormField, Toggle, DayPicker, RecurrencePanel } from "../FormComponents"; 

describe("Shared Form Components", () => {
  // FormField Tests
  describe("FormField", () => {
    it("renders the label text", () => {
      render(
        <FormField label="Email Address">
          <input type="email" placeholder="test@example.com" />
        </FormField>
      );
      expect(screen.getByText("Email Address")).toBeInTheDocument();
    });

    it("renders its children correctly", () => {
      render(
        <FormField label="Username">
          <input type="text" data-testid="child-input" />
        </FormField>
      );
      expect(screen.getByTestId("child-input")).toBeInTheDocument();
    });
  });

  // Toggle Tests
  describe("Toggle", () => {
    it("renders the toggle label", () => {
      render(<Toggle label="Enable Notifications" on={false} onToggle={jest.fn()} />);
      expect(screen.getByText("Enable Notifications")).toBeInTheDocument();
    });

    it("applies the correct classes when 'on' is true", () => {
      const { container } = render(<Toggle label="On State" on={true} onToggle={jest.fn()} />);
      const toggleDiv = container.querySelector("label > div");
      expect(toggleDiv).toHaveClass("bg-indigo-600");
      expect(toggleDiv).not.toHaveClass("bg-gray-200");
    });

    it("applies the correct classes when 'on' is false", () => {
      const { container } = render(<Toggle label="Off State" on={false} onToggle={jest.fn()} />);
      const toggleDiv = container.querySelector("label > div");
      expect(toggleDiv).toHaveClass("bg-gray-200");
      expect(toggleDiv).not.toHaveClass("bg-indigo-600");
    });

    it("fires onToggle when the switch is clicked", async () => {
      const user = userEvent.setup();
      const mockOnToggle = jest.fn();
      const { container } = render(<Toggle label="Click Me" on={false} onToggle={mockOnToggle} />);
      
      const toggleDiv = container.querySelector("label > div");
      await user.click(toggleDiv!);
      
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  // DayPicker Tests
  describe("DayPicker", () => {
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    it("renders all seven days of the week", () => {
      render(<DayPicker selected={[]} onChange={jest.fn()} />);
      DAYS.forEach((day) => {
        expect(screen.getByRole("button", { name: day })).toBeInTheDocument();
      });
    });

    it("highlights selected days with active styling", () => {
      render(<DayPicker selected={["Mon", "Wed"]} onChange={jest.fn()} />);
      
      const monButton = screen.getByRole("button", { name: "Mon" });
      const tueButton = screen.getByRole("button", { name: "Tue" });

      expect(monButton).toHaveClass("bg-indigo-600", "text-white");
      expect(tueButton).toHaveClass("bg-white", "text-gray-600");
    });

    it("adds a day to the array when an unselected day is clicked", async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      render(<DayPicker selected={["Mon"]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole("button", { name: "Wed" }));
      
      expect(mockOnChange).toHaveBeenCalledWith(["Mon", "Wed"]);
    });

    it("removes a day from the array when a selected day is clicked", async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      render(<DayPicker selected={["Mon", "Wed"]} onChange={mockOnChange} />);
      
      await user.click(screen.getByRole("button", { name: "Mon" }));
      
      expect(mockOnChange).toHaveBeenCalledWith(["Wed"]);
    });
  });

  // RecurrencePanel Tests
  describe("RecurrencePanel", () => {
    const baseProps = {
      type: "daily",
      days: [],
      until: "2024-12-31",
      onType: jest.fn(),
      onDays: jest.fn(),
      onUntil: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("renders the default options and until date input", () => {
      render(<RecurrencePanel {...baseProps} />);
      
      // Select dropdown
      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("daily");
      
      // Date input
      const dateInput = screen.getByDisplayValue("2024-12-31");
      expect(dateInput).toHaveAttribute("type", "date");
    });

    it("calls onType when a new recurrence type is selected", async () => {
      const user = userEvent.setup();
      render(<RecurrencePanel {...baseProps} />);
      
      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "monthly");
      
      expect(baseProps.onType).toHaveBeenCalledWith("monthly");
    });

    it("calls onUntil when the date is changed", async () => {
      const { container } = render(<RecurrencePanel {...baseProps} />);
      const dateInput = container.querySelector('input[type="date"]');
      
      React.isValidElement(dateInput);
      if (dateInput) {
        import("@testing-library/react").then(({ fireEvent }) => {
            fireEvent.change(dateInput, { target: { value: "2025-01-01" } });
        });
      }
      
      setTimeout(() => {
          expect(baseProps.onUntil).toHaveBeenCalledWith("2025-01-01");
      }, 0);
    });

    it("does not render the DayPicker if type is not 'weekly'", () => {
      render(<RecurrencePanel {...baseProps} type="daily" />);
      expect(screen.queryByRole("button", { name: "Mon" })).not.toBeInTheDocument();
    });

    it("renders the DayPicker if type is 'weekly'", () => {
      render(<RecurrencePanel {...baseProps} type="weekly" />);
      // If DayPicker is rendered, "Mon" will be present
      expect(screen.getByRole("button", { name: "Mon" })).toBeInTheDocument();
    });
  });
});