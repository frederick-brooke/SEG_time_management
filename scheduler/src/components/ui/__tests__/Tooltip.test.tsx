import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/Tooltip";

beforeAll(() => {
  // Mock PointerEvent for Radix UI interactions
  if (typeof window !== "undefined" && !window.PointerEvent) {
    window.PointerEvent = MouseEvent as any;
  }
  
  // Mock ResizeObserver for Radix UI positioning calculations
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

describe("Tooltip Components", () => {
  // Helper component to render a standard tooltip
  const TestTooltip = ({ contentClassName, sideOffset }: any) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger className="trigger-class">Hover Me</TooltipTrigger>
        <TooltipContent data-testid="tooltip-content" className={contentClassName} sideOffset={sideOffset}>
          Tooltip Content
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  it("renders the trigger button initially but hides the content", () => {
    render(<TestTooltip />);

    const trigger = screen.getByText("Hover Me");
    expect(trigger).toBeInTheDocument();

    const content = screen.queryByTestId("tooltip-content");
    expect(content).not.toBeInTheDocument();
  });

  it("shows the tooltip content when the trigger is hovered", async () => {
    const user = userEvent.setup();
    render(<TestTooltip />);

    const trigger = screen.getByText("Hover Me");
    
    await user.hover(trigger);

    const tooltip = await screen.findByTestId("tooltip-content");
    
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Tooltip Content");
    expect(tooltip).toHaveAttribute("data-state", "delayed-open");
  });

  it("shows the tooltip content when the trigger is focused (keyboard accessibility)", async () => {
    const user = userEvent.setup();
    render(<TestTooltip />);

    await user.tab();

    const trigger = screen.getByText("Hover Me");
    expect(trigger).toHaveFocus();

    const tooltip = await screen.findByTestId("tooltip-content");
    expect(tooltip).toBeInTheDocument();
  });

  it("hides the tooltip when dismissed via Escape", async () => {
    const user = userEvent.setup();
    render(<TestTooltip />);

    const trigger = screen.getByText("Hover Me");
    
    await user.hover(trigger);
    const tooltip = await screen.findByTestId("tooltip-content");
    expect(tooltip).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();
    });
  });

  it("merges custom classNames correctly on the content", async () => {
    const user = userEvent.setup();
    render(<TestTooltip contentClassName="custom-bg-red" />);

    const trigger = screen.getByText("Hover Me");
    await user.hover(trigger);

    const tooltip = await screen.findByTestId("tooltip-content");
    
    // Check that base classes + custom class exist
    expect(tooltip).toHaveClass("bg-foreground", "text-background", "custom-bg-red");
  });

  it("applies the data-slots correctly to all components", async () => {
    const user = userEvent.setup();
    render(<TestTooltip />);

    const trigger = screen.getByText("Hover Me");
    expect(trigger).toHaveAttribute("data-slot", "tooltip-trigger");

    await user.hover(trigger);
    
    const tooltip = await screen.findByTestId("tooltip-content");
    expect(tooltip).toHaveAttribute("data-slot", "tooltip-content");
  });
});