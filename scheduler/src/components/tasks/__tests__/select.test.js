import React from "react";
import { render, screen } from "@testing-library/react";

// Mock lucide icons so we can assert presence by testid
jest.mock("lucide-react", () => ({
  __esModule: true,
  CheckIcon: (props) => <svg data-testid="check-icon" {...props} />,
  ChevronDownIcon: (props) => <svg data-testid="chevron-down" {...props} />,
  ChevronUpIcon: (props) => <svg data-testid="chevron-up" {...props} />,
}));

// Mock Radix Select primitives as plain React components
jest.mock("@radix-ui/react-select", () => {
  const React = require("react");

  const Root = ({ children, ...props }) => (
    <div data-testid="radix-root" {...props}>
      {children}
    </div>
  );

  const Group = ({ children, ...props }) => (
    <div data-testid="radix-group" {...props}>
      {children}
    </div>
  );

  const Value = ({ children, ...props }) => (
    <div data-testid="radix-value" {...props}>
      {children}
    </div>
  );

  const Trigger = ({ children, ...props }) => (
    <button data-testid="radix-trigger" type="button" {...props}>
      {children}
    </button>
  );

  const Portal = ({ children, ...props }) => (
    <div data-testid="radix-portal" {...props}>
      {children}
    </div>
  );

  const Content = ({ children, ...props }) => (
    <div data-testid="radix-content" {...props}>
      {children}
    </div>
  );

  const Viewport = ({ children, ...props }) => (
    <div data-testid="radix-viewport" {...props}>
      {children}
    </div>
  );

  const Label = ({ children, ...props }) => (
    <div data-testid="radix-label" {...props}>
      {children}
    </div>
  );

  const Item = ({ children, ...props }) => (
    <div data-testid="radix-item" {...props}>
      {children}
    </div>
  );

  const ItemText = ({ children, ...props }) => (
    <span data-testid="radix-item-text" {...props}>
      {children}
    </span>
  );

  const ItemIndicator = ({ children, ...props }) => (
    <span data-testid="radix-item-indicator" {...props}>
      {children}
    </span>
  );

  const Separator = (props) => <div data-testid="radix-separator" {...props} />;

  const ScrollUpButton = ({ children, ...props }) => (
    <div data-testid="radix-scroll-up" {...props}>
      {children}
    </div>
  );

  const ScrollDownButton = ({ children, ...props }) => (
    <div data-testid="radix-scroll-down" {...props}>
      {children}
    </div>
  );

  const Icon = ({ children, ...props }) => (
    <span data-testid="radix-icon" {...props}>
      {children}
    </span>
  );

  return {
    __esModule: true,
    Root,
    Group,
    Value,
    Trigger,
    Portal,
    Content,
    Viewport,
    Label,
    Item,
    ItemText,
    ItemIndicator,
    Separator,
    ScrollUpButton,
    ScrollDownButton,
    Icon,
  };
});

// Import after mocks
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

describe("components/ui/select", () => {
  it("renders select primitives (including scroll buttons) and hits uncovered lines", () => {
    render(
      <Select>
        <SelectTrigger className="my-trigger" size="sm">
          <SelectValue>Value</SelectValue>
        </SelectTrigger>

        {/* popper branch */}
        <SelectContent className="my-content" position="popper" align="start">
          {/* Explicit scroll buttons */}
          <SelectScrollUpButton className="my-up" />

          <SelectLabel className="my-label">Label</SelectLabel>

          <SelectGroup>
            <SelectItem className="my-item" value="a">
              Item A
            </SelectItem>
            <SelectSeparator className="my-sep" />
          </SelectGroup>

          <SelectScrollDownButton className="my-down" />
        </SelectContent>
      </Select>,
    );

    // Trigger basics
    const trigger = screen.getByTestId("radix-trigger");
    expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    expect(trigger).toHaveAttribute("data-size", "sm");
    expect(trigger.className).toMatch(/my-trigger/);

    // ✅ chevron-down appears multiple times: use getAllByTestId
    const chevronDowns = screen.getAllByTestId("chevron-down");
    expect(chevronDowns.length).toBeGreaterThanOrEqual(2);

    // popper branch adds translate classes
    const content = screen.getByTestId("radix-content");
    expect(content).toHaveAttribute("data-slot", "select-content");
    expect(content.className).toMatch(/translate-y-1/);
    expect(content.className).toMatch(/my-content/);

    // Viewport exists
    expect(screen.getByTestId("radix-viewport")).toBeInTheDocument();

    // Scroll buttons exist + icons exist
    expect(screen.getAllByTestId("radix-scroll-up").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      screen.getAllByTestId("radix-scroll-down").length,
    ).toBeGreaterThanOrEqual(1);

    const chevronUps = screen.getAllByTestId("chevron-up");
    expect(chevronUps.length).toBeGreaterThanOrEqual(1);

    // Label / Item / Separator / Check icon
    expect(screen.getByTestId("radix-label")).toHaveTextContent("Label");
    expect(screen.getByTestId("radix-item-text")).toHaveTextContent("Item A");
    expect(screen.getByTestId("radix-separator")).toBeInTheDocument();
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
  });
});
