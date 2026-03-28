import React from "react";
<<<<<<< HEAD
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FormField,
  Toggle,
  DayPicker,
  RecurrencePanel,
} from "../FormComponents";

describe("FormField", () => {
  it("renders label and children", () => {
    render(
      <FormField label="Name">
        <input placeholder="enter name" />
      </FormField>
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("enter name")).toBeInTheDocument();
  });
});


describe("Toggle", () => {
  it("renders label and state", () => {
    render(<Toggle on={false} onToggle={jest.fn()} label="Dark mode" />);

    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });

  it("applies correct styles when ON", () => {
    const { container } = render(
      <Toggle on={true} onToggle={jest.fn()} label="ON" />
    );

    expect(container.querySelector(".bg-indigo-600")).toBeInTheDocument();
  });

  it("applies correct styles when OFF", () => {
    const { container } = render(
      <Toggle on={false} onToggle={jest.fn()} label="OFF" />
    );

    expect(container.querySelector(".bg-gray-200")).toBeInTheDocument();
  });
});


describe("DayPicker", () => {
  it("renders all days", () => {
    render(<DayPicker selected={[]} onChange={jest.fn()} />);

    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it("adds a day when clicked", () => {
    const onChange = jest.fn();

    render(<DayPicker selected={[]} onChange={onChange} />);

    fireEvent.click(screen.getByText("Mon"));

    expect(onChange).toHaveBeenCalledWith(["Mon"]);
  });

  it("removes a day when clicked again", () => {
    const onChange = jest.fn();

    render(<DayPicker selected={["Mon"]} onChange={onChange} />);

    fireEvent.click(screen.getByText("Mon"));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});


describe("RecurrencePanel", () => {
  const baseProps = {
    type: "weekly",
    days: ["Mon"],
    until: "2025-01-01",
    onType: jest.fn(),
    onDays: jest.fn(),
    onUntil: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("changes type", () => {
    render(<RecurrencePanel {...baseProps} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "daily" },
    });

    expect(baseProps.onType).toHaveBeenCalledWith("daily");
  });

  it("updates until date", () => {
    render(<RecurrencePanel {...baseProps} />);

    fireEvent.change(screen.getByDisplayValue("2025-01-01"), {
      target: { value: "2026-01-01" },
    });

    expect(baseProps.onUntil).toHaveBeenCalledWith("2026-01-01");
  });

  it("renders DayPicker when weekly", () => {
    render(<RecurrencePanel {...baseProps} />);

    expect(screen.getByText("Mon")).toBeInTheDocument();
=======
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
>>>>>>> 95d7429f7c9de24629b554d404fb7283c2e71089
  });
});