/**
 * Testing for UI Context.
 */

import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import { UIProvider, useUI } from "../UIContext";

/**
 * Test component that consumes the context
 */
function TestComponent() {
  const { wellbeingOpen, setWellbeingOpen } = useUI();

  return (
    <div>
      <p data-testid="state">{wellbeingOpen ? "open" : "closed"}</p>

      <Button
        onClick={() => setWellbeingOpen((prev) => !prev)}
      >
        toggle
      </Button>
    </div>
  );
}

// Tests

describe("UIContext", () => {
  it("provides default state as false", () => {
    render(
      <UIProvider>
        <TestComponent />
      </UIProvider>
    );

    expect(screen.getByTestId("state").textContent).toBe("closed");
  });

  it("updates state when toggled", () => {
    render(
      <UIProvider>
        <TestComponent />
      </UIProvider>
    );

    const button = screen.getByText("toggle");

    fireEvent.click(button);

    expect(screen.getByTestId("state").textContent).toBe("open");

    fireEvent.click(button);

    expect(screen.getByTestId("state").textContent).toBe("closed");
  });

  it("throws error when used outside provider", () => {
    // suppress error output in test runner
    const consoleError = console.error;
    console.error = jest.fn();

    expect(() => render(<TestComponent />)).toThrow(
      "useUI must be used within a UIProvider"
    );

    console.error = consoleError;
  });
});