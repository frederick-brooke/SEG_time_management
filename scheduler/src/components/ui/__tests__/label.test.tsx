import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Label } from "../label"; 

jest.mock("lib/utils", () => ({
  cn: (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" "),
}));


// Helpers

function getLabel() {
  return document.querySelector("[data-slot='label']") as HTMLElement;
}

// Label

describe("Label", () => {
  it("renders without crashing", () => {
    render(<Label className="">Email</Label>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("has data-slot='label'", () => {
    render(<Label className="">Username</Label>);
    expect(getLabel()).toBeInTheDocument();
  });

  it("renders as a <label> element", () => {
    render(<Label className="">Password</Label>);
    expect(getLabel().tagName).toBe("LABEL");
  });

  it("renders children correctly", () => {
    render(<Label className="">Remember me</Label>);
    expect(screen.getByText("Remember me")).toBeInTheDocument();
  });

  it("applies the base utility classes", () => {
    render(<Label className="">Base</Label>);
    const label = getLabel();
    expect(label.className).toContain("flex");
    expect(label.className).toContain("items-center");
    expect(label.className).toContain("gap-2");
    expect(label.className).toContain("text-sm");
    expect(label.className).toContain("font-medium");
    expect(label.className).toContain("select-none");
    expect(label.className).toContain("leading-none");
  });

  it("merges a custom className", () => {
    render(<Label className="my-custom-class">Custom</Label>);
    expect(getLabel().className).toContain("my-custom-class");
  });

  it("custom className is appended alongside base classes", () => {
    render(<Label className="text-red-500">Custom</Label>);
    const label = getLabel();
    expect(label.className).toContain("text-red-500");
    expect(label.className).toContain("text-sm"); 
  });

  it("forwards the htmlFor prop to the underlying label", () => {
    render(<Label className="" htmlFor="email-input">Email</Label>);
    expect(getLabel()).toHaveAttribute("for", "email-input");
  });

  it("associates with an input via htmlFor", () => {
    render(
      <>
        <Label className="" htmlFor="name">Name</Label>
        <input id="name" />
      </>
    );
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("forwards arbitrary HTML attributes", () => {
    render(<Label className="" data-testid="my-label">Test</Label>);
    expect(screen.getByTestId("my-label")).toBeInTheDocument();
  });

  it("renders child elements, not just strings", () => {
    render(
      <Label className="">
        <span data-testid="icon" />
        With icon
      </Label>
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("With icon")).toBeInTheDocument();
  });
});
