import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Skeleton } from "../Skeleton"; 

describe("Skeleton Component", () => {
  it("renders correctly in the document", () => {
    render(<Skeleton data-testid="test-skeleton" className="" />);
    
    const skeleton = screen.getByTestId("test-skeleton");
    expect(skeleton).toBeInTheDocument();
  });

  it("applies the default tailwind classes and data-slot", () => {
    render(<Skeleton data-testid="test-skeleton" className="" />);
    
    const skeleton = screen.getByTestId("test-skeleton");
    
    // Check for the base classes you defined
    expect(skeleton).toHaveClass("bg-accent", "animate-pulse", "rounded-md");
    
    // Check for the radix-style data slot
    expect(skeleton).toHaveAttribute("data-slot", "skeleton");
  });

  it("merges custom classNames correctly using the cn utility", () => {
    render(<Skeleton data-testid="test-skeleton" className="my-custom-class h-10 w-10 bg-red-500" />);
    
    const skeleton = screen.getByTestId("test-skeleton");
    
    // Should have the custom classes
    expect(skeleton).toHaveClass("my-custom-class", "h-10", "w-10", "bg-red-500");
    
    // Base structural classes should still be there
    expect(skeleton).toHaveClass("animate-pulse", "rounded-md");
  });

  it("passes through additional HTML attributes", () => {
    render(
      <Skeleton 
        data-testid="test-skeleton" 
        id="loading-indicator" 
        aria-hidden="true" 
        title="Loading content..."
        className="" 
      />
    );
    
    const skeleton = screen.getByTestId("test-skeleton");
    
    expect(skeleton).toHaveAttribute("id", "loading-indicator");
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(skeleton).toHaveAttribute("title", "Loading content...");
  });
});