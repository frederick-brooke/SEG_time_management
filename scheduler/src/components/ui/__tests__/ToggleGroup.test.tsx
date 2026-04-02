import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen } from "@testing-library/react";

const toggleVariantsMock = jest.fn((_args: { variant?: string; size?: string }) => "toggle-variants-class");

jest.mock("components/ui/toggle", () => ({
  __esModule: true,
  toggleVariants: (args: { variant?: string; size?: string }) => toggleVariantsMock(args),
}));

jest.mock("@radix-ui/react-toggle-group", () => {
  const React = require("react");

  const Root = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="radix-root" {...props}>
      {children}
    </div>
  );

  const Item = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <Button data-testid="radix-item" type="button" {...props}>
      {children}
    </Button>
  );

  return {
    __esModule: true,
    Root,
    Item,
  };
});

import { ToggleGroup, ToggleGroupItem } from "../ToggleGroup";

describe("components/ui/toggle-group", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses context variant/size when provided by ToggleGroup", () => {
    render(
      <ToggleGroup variant="outline" size="sm" spacing={2} className="my-group">
        <ToggleGroupItem value="a" className="my-item">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const root = screen.getByTestId("radix-root");
    expect(root).toHaveAttribute("data-slot", "toggle-group");
    expect(root).toHaveAttribute("data-variant", "outline");
    expect(root).toHaveAttribute("data-size", "sm");
    expect(root).toHaveAttribute("data-spacing", "2");
    expect(root.className).toMatch(/my-group/);

    expect(toggleVariantsMock).toHaveBeenCalledWith({
      variant: "outline",
      size: "sm",
    });

    const item = screen.getByTestId("radix-item");
    expect(item).toHaveAttribute("data-slot", "toggle-group-item");
    expect(item).toHaveAttribute("data-variant", "outline");
    expect(item).toHaveAttribute("data-size", "sm");
    expect(item.className).toMatch(/toggle-variants-class/);
    expect(item.className).toMatch(/my-item/);
    expect(item).toHaveTextContent("A");
  });

  it("falls back to item props when context variant/size are missing (covers lines 55,59)", () => {
    render(
      <ToggleGroup>
        <ToggleGroupItem value="b" variant="default" size="lg">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(toggleVariantsMock).toHaveBeenCalledWith({
      variant: "default",
      size: "lg",
    });

    const item = screen.getByTestId("radix-item");
    expect(item).toHaveAttribute("data-variant", "default");
    expect(item).toHaveAttribute("data-size", "lg");
    expect(item).toHaveTextContent("B");
  });
});
