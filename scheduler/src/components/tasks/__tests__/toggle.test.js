import React from "react";
import { render, screen } from "@testing-library/react";

// Mock Radix Toggle primitive so we don't rely on Radix internals
jest.mock("@radix-ui/react-toggle", () => {
  const React = require("react");
  return {
    __esModule: true,
    Root: ({ children, ...props }) => (
      <button type="button" data-testid="radix-toggle" {...props}>
        {children}
      </button>
    ),
  };
});

// Import AFTER mocks
import { Toggle, toggleVariants } from "../../ui/toggle";

describe("components/ui/toggle", () => {
  it("renders Toggle with data-slot and merges className (also covers Toggle function)", () => {
    render(
      <Toggle className="my-toggle" aria-pressed="false">
        Hello
      </Toggle>,
    );

    const el = screen.getByTestId("radix-toggle");
    expect(el).toHaveAttribute("data-slot", "toggle");
    expect(el).toHaveTextContent("Hello");

    // should include our custom class AND base toggle styles
    expect(el.className).toMatch(/my-toggle/);
    expect(el.className).toMatch(/inline-flex/);
  });

  it("applies variant/size classes when provided", () => {
    render(
      <Toggle variant="outline" size="lg">
        Outline Large
      </Toggle>,
    );

    const el = screen.getByTestId("radix-toggle");

    // from toggleVariants outline variant
    expect(el.className).toMatch(/border/);
    // from toggleVariants lg size
    expect(el.className).toMatch(/h-10/);
  });

  it("toggleVariants uses defaults when called with no args (covers exported helper)", () => {
    const classes = toggleVariants();

    // default variant => bg-transparent
    expect(classes).toMatch(/bg-transparent/);
    // default size => h-9
    expect(classes).toMatch(/h-9/);

    // also should include some base class
    expect(classes).toMatch(/inline-flex/);
  });
});
