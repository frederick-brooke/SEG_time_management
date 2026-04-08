/**
 * Testing for Button component.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "../Button";

jest.mock("@radix-ui/react-slot", () => ({
  Slot: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} data-testid="slot" {...props}>
      {children}
    </div>
  )),
}));

describe("Button Component", () => {
  it("renders a normal button by default", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("renders as Slot when asChild is true", () => {
    render(<Button asChild>Child content</Button>);

    const slot = screen.getByTestId("slot");
    expect(slot).toBeInTheDocument();
    expect(slot).toHaveTextContent("Child content");
  });

  it("applies default variant and size classes", () => {
    render(<Button>Default</Button>);

    const button = screen.getByRole("button", { name: "Default" });
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("h-9");
  });

  it("applies destructive variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-destructive");
    expect(button).toHaveAttribute("data-variant", "destructive");
  });

  it("applies outline variant classes", () => {
    render(<Button variant="outline">Outline</Button>);

    const button = screen.getByRole("button", { name: "Outline" });
    expect(button.className).toContain("border");
  });

  it("applies secondary variant classes", () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByRole("button", { name: "Secondary" });
    expect(button.className).toContain("bg-secondary");
  });

  it("applies ghost variant classes", () => {
    render(<Button variant="ghost">Ghost</Button>);

    const button = screen.getByRole("button", { name: "Ghost" });
    expect(button).toHaveAttribute("data-variant", "ghost");
  });

  it("applies link variant classes", () => {
    render(<Button variant="link">Link</Button>);

    const button = screen.getByRole("button", { name: "Link" });
    expect(button.className).toContain("underline");
  });

  it("applies xs size classes", () => {
    render(<Button size="xs">XS</Button>);

    const button = screen.getByRole("button", { name: "XS" });
    expect(button.className).toContain("h-6");
    expect(button).toHaveAttribute("data-size", "xs");
  });

  it("applies sm size classes", () => {
    render(<Button size="sm">SM</Button>);

    const button = screen.getByRole("button", { name: "SM" });
    expect(button.className).toContain("h-8");
  });

  it("applies lg size classes", () => {
    render(<Button size="lg">LG</Button>);

    const button = screen.getByRole("button", { name: "LG" });
    expect(button.className).toContain("h-10");
  });

  it("applies icon size classes", () => {
    render(<Button size="icon">Icon</Button>);

    const button = screen.getByRole("button", { name: "Icon" });
    expect(button.className).toContain("size-9");
  });

  it("applies icon-xs size classes", () => {
    render(<Button size="icon-xs">Icon XS</Button>);

    const button = screen.getByRole("button", { name: "Icon XS" });
    expect(button.className).toContain("size-6");
  });

  it("applies icon-sm size classes", () => {
    render(<Button size="icon-sm">Icon SM</Button>);

    const button = screen.getByRole("button", { name: "Icon SM" });
    expect(button.className).toContain("size-8");
  });

  it("applies icon-lg size classes", () => {
    render(<Button size="icon-lg">Icon LG</Button>);

    const button = screen.getByRole("button", { name: "Icon LG" });
    expect(button.className).toContain("size-10");
  });

  it("merges custom className", () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole("button", { name: "Custom" });
    expect(button.className).toContain("custom-class");
  });

  it("forwards refs", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveTextContent("Ref Button");
  });

  it("exports buttonVariants", () => {
    expect(buttonVariants).toBeDefined();
  });
});