import React from "react";
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
  });
});