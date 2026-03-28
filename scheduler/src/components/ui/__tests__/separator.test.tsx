import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Separator } from "../separator"; 

describe("Separator Component", () => {
  it("renders correctly with default props", () => {
    const { container } = render(<Separator />);
    
    // Select by the data-slot attribute you added
    const separator = container.querySelector('[data-slot="separator"]');
    
    expect(separator).toBeInTheDocument();
    
    expect(separator).toHaveAttribute("role", "none");
    
    // Default orientation should be horizontal
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
    
    expect(separator).toHaveClass("bg-border", "data-[orientation=horizontal]:h-px", "data-[orientation=horizontal]:w-full");
  });

  it("renders correctly with a vertical orientation", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const separator = container.querySelector('[data-slot="separator"]');
    
    expect(separator).toHaveAttribute("data-orientation", "vertical");
    
    expect(separator).toHaveClass("data-[orientation=vertical]:h-full", "data-[orientation=vertical]:w-px");
  });

  it("handles the decorative prop correctly for accessibility", () => {
    const { container } = render(<Separator decorative={false} />);
    const separator = container.querySelector('[data-slot="separator"]');
    
    expect(separator).toHaveAttribute("role", "separator");
  });

  it("merges custom classNames correctly", () => {
    const { container } = render(<Separator className="my-custom-class bg-red-500" />);
    const separator = container.querySelector('[data-slot="separator"]');
    
    expect(separator).toHaveClass("my-custom-class");
    expect(separator).toHaveClass("bg-red-500");
    expect(separator).toHaveClass("shrink-0"); 
  });

  it("passes through additional HTML attributes", () => {
    const { container } = render(<Separator id="main-separator" aria-hidden="true" />);
    const separator = container.querySelector('[data-slot="separator"]');
    
    expect(separator).toHaveAttribute("id", "main-separator");
    expect(separator).toHaveAttribute("aria-hidden", "true");
  });
});