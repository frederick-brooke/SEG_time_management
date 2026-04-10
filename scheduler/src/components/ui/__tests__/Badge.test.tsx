import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Badge } from "../Badge";

describe("Badge Component", () => {
  it("renders the badge text correctly", () => {
    render(<Badge>New Feature</Badge>);
    expect(screen.getByText("New Feature")).toBeInTheDocument();
  });

  it("applies the default variant classes", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    // Checking for primary background which is the default variant
    expect(badge).toHaveClass("bg-primary");
    expect(badge).toHaveAttribute("data-slot", "badge");
  });

  it("applies the correct classes for different variants", () => {
    const { rerender } = render(<Badge variant="destructive">Delete</Badge>);
    expect(screen.getByText("Delete")).toHaveClass("bg-destructive");

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText("Outline")).toHaveClass("border-border");

    rerender(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText("Secondary")).toHaveClass("bg-secondary");
  });

  it("renders as a different element when 'asChild' is true", () => {
    render(
      <Badge asChild>
        <a href="https://google.com">Link Badge</a>
      </Badge>
    );
    
    const badge = screen.getByRole("link", { name: /link badge/i });
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe("A");
    // It should still have the badge styling
    expect(badge).toHaveClass("inline-flex");
  });

  it("merges custom classNames correctly", () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText("Custom");
    expect(badge).toHaveClass("custom-class");
    expect(badge).toHaveClass("inline-flex"); // Base styles should remain
  });

  it("passes through additional HTML attributes", () => {
    render(<Badge id="test-badge" title="badge-title">Hover me</Badge>);
    const badge = screen.getByText("Hover me");
    expect(badge).toHaveAttribute("id", "test-badge");
    expect(badge).toHaveAttribute("title", "badge-title");
  });
});