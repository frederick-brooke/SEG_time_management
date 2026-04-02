import * as React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import GlowBackground from "../GlowBackground";

describe("GlowBackground", () => {
  it("renders without crashing", () => {
    const { container } = render(<GlowBackground />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders two nested divs", () => {
    const { container } = render(<GlowBackground />);
    const divs = container.querySelectorAll("div");
    expect(divs.length).toBe(2);
  });

  it("outer div is absolutely positioned and centred", () => {
    const { container } = render(<GlowBackground />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain("absolute");
    expect(outer.className).toContain("top-0");
    expect(outer.className).toContain("left-1/2");
    expect(outer.className).toContain("-translate-x-1/2");
  });

  it("outer div has the expected fixed dimensions", () => {
    const { container } = render(<GlowBackground />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain("w-[900px]");
    expect(outer.className).toContain("h-[900px]");
  });

  it("outer div has pointer-events-none so it doesn't block interactions", () => {
    const { container } = render(<GlowBackground />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain("pointer-events-none");
  });

  it("inner div is full width and height", () => {
    const { container } = render(<GlowBackground />);
    const outer = container.firstChild as HTMLElement;
    const inner = outer.firstChild as HTMLElement;
    expect(inner.className).toContain("w-full");
    expect(inner.className).toContain("h-full");
  });

  it("inner div is a circle (rounded-full)", () => {
    const { container } = render(<GlowBackground />);
    const outer = container.firstChild as HTMLElement;
    const inner = outer.firstChild as HTMLElement;
    expect(inner.className).toContain("rounded-full");
  });

  it("inner div carries the radial-gradient background class", () => {
    const { container } = render(<GlowBackground />);
    const outer = container.firstChild as HTMLElement;
    const inner = outer.firstChild as HTMLElement;
    expect(inner.className).toContain("bg-[radial-gradient(");
  });

  it("radial gradient uses the expected blue colour stop", () => {
    const { container } = render(<GlowBackground />);
    const outer = container.firstChild as HTMLElement;
    const inner = outer.firstChild as HTMLElement;
    expect(inner.className).toContain("rgba(90,150,255,0.12)");
  });

  it("radial gradient fades to transparent at 70%", () => {
    const { container } = render(<GlowBackground />);
    const outer = container.firstChild as HTMLElement;
    const inner = outer.firstChild as HTMLElement;
    expect(inner.className).toContain("transparent_70%");
  });
});
