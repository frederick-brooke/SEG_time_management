/**
 * Testing for Calendar components.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { Calendar, CalendarDayButton } from "../Calendar";

const mockDayPicker = jest.fn();

jest.mock("react-day-picker", () => ({
  DayPicker: (props: any) => {
    mockDayPicker(props);
    return <div data-testid="day-picker" />;
  },
  getDefaultClassNames: () => ({
    root: "rdp-root",
    months: "rdp-months",
    month: "rdp-month",
    nav: "rdp-nav",
    button_previous: "rdp-button-previous",
    button_next: "rdp-button-next",
  }),
}));

jest.mock("lucide-react", () => ({
  ChevronDownIcon: (props: any) => <svg data-testid="chevron-down" {...props} />,
  ChevronLeftIcon: (props: any) => <svg data-testid="chevron-left" {...props} />,
  ChevronRightIcon: (props: any) => <svg data-testid="chevron-right" {...props} />,
}));

jest.mock("../Button", () => ({
  Button: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <button ref={ref} data-testid="button" {...props}>
      {children}
    </button>
  )),
  buttonVariants: ({ variant }: any) => `button-${variant ?? "default"}`,
}));

describe("Calendar Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders DayPicker with default props", () => {
    render(<Calendar />);

    expect(screen.getByTestId("day-picker")).toBeInTheDocument();
    expect(mockDayPicker).toHaveBeenCalledTimes(1);

    const props = mockDayPicker.mock.calls[0][0];
    expect(props.showOutsideDays).toBe(true);
    expect(props.captionLayout).toBe("label");
  });

  it("passes custom props to DayPicker", () => {
    render(
      <Calendar
        className="custom-calendar"
        showOutsideDays={false}
        captionLayout="dropdown"
        buttonVariant="outline"
      />
    );

    const props = mockDayPicker.mock.calls[0][0];
    expect(props.showOutsideDays).toBe(false);
    expect(props.captionLayout).toBe("dropdown");
    expect(props.className).toContain("custom-calendar");
    expect(props.classNames.button_previous).toContain("button-outline");
    expect(props.classNames.button_next).toContain("button-outline");
  });

  it("merges custom classNames", () => {
    render(
      <Calendar
        classNames={{
          root: "custom-root",
          nav: "custom-nav",
        }}
      />
    );

    const props = mockDayPicker.mock.calls[0][0];
    expect(props.classNames.root).toContain("custom-root");
    expect(props.classNames.nav).toContain("custom-nav");
  });

  it("merges custom components", () => {
    const CustomComponent = () => <div>Custom</div>;

    render(
      <Calendar
        components={{
          Footer: CustomComponent,
        }}
      />
    );

    const props = mockDayPicker.mock.calls[0][0];
    expect(props.components.Footer).toBe(CustomComponent);
    expect(props.components.DayButton).toBe(CalendarDayButton);
  });

  it("uses default month dropdown formatter", () => {
    render(<Calendar />);

    const props = mockDayPicker.mock.calls[0][0];
    const value = props.formatters.formatMonthDropdown(new Date("2026-04-06"));
    expect(value).toBe("Apr");
  });

  it("allows custom formatters to override default formatter", () => {
    render(
      <Calendar
        formatters={{
          formatMonthDropdown: () => "Custom Month",
        }}
      />
    );

    const props = mockDayPicker.mock.calls[0][0];
    expect(props.formatters.formatMonthDropdown(new Date("2026-04-06"))).toBe("Custom Month");
  });

  it("renders left chevron", () => {
    render(<Calendar />);

    const props = mockDayPicker.mock.calls[0][0];
    const Chevron = props.components.Chevron;
    render(<Chevron orientation="left" />);

    expect(screen.getByTestId("chevron-left")).toBeInTheDocument();
  });

  it("renders right chevron", () => {
    render(<Calendar />);

    const props = mockDayPicker.mock.calls[0][0];
    const Chevron = props.components.Chevron;
    render(<Chevron orientation="right" />);

    expect(screen.getByTestId("chevron-right")).toBeInTheDocument();
  });

  it("renders down chevron for other orientations", () => {
    render(<Calendar />);

    const props = mockDayPicker.mock.calls[0][0];
    const Chevron = props.components.Chevron;
    render(<Chevron orientation="down" />);

    expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
  });

  it("renders custom Root component", () => {
    render(<Calendar />);

    const props = mockDayPicker.mock.calls[0][0];
    const Root = props.components.Root;
    render(<Root className="root-class" />);

    const root = document.querySelector(".root-class");
    expect(root).toBeInTheDocument();
  });

  it("renders CalendarDayButton", () => {
    render(
      <CalendarDayButton
        day={{ date: new Date("2026-04-06") } as any}
        modifiers={{ focused: false } as any}
      />
    );

    const button = screen.getByTestId("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-day");
  });

  it("focuses CalendarDayButton when focused modifier is true", () => {
    render(
      <CalendarDayButton
        day={{ date: new Date("2026-04-06") } as any}
        modifiers={{ focused: true } as any}
      />
    );

    expect(screen.getByTestId("button")).toHaveFocus();
  });

  it("applies custom className to CalendarDayButton", () => {
    render(
      <CalendarDayButton
        className="custom-day"
        day={{ date: new Date("2026-04-06") } as any}
        modifiers={{ focused: false } as any}
      />
    );

    expect(screen.getByTestId("button").className).toContain("custom-day");
  });
});