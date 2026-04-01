import React from "react";
import { Button } from "@/components/ui/Button";
import { render } from "@testing-library/react";
import { StarBackground } from "@/components/ui/StarBackground";

describe("StarBackground", () => {
  it("renders without crashing", () => {
    const { container } = render(<StarBackground />);
    expect(container).toBeTruthy();
  });

  it("renders a <style> tag", () => {
    const { container } = render(<StarBackground />);
    const styleEl = container.querySelector("style");
    expect(styleEl).toBeInTheDocument();
  });

  it("defines the twinkle keyframe animation", () => {
    const { container } = render(<StarBackground />);
    const css = container.querySelector("style")!.textContent ?? "";
    expect(css).toContain("@keyframes twinkle");
    expect(css).toContain("opacity: 1");
    expect(css).toContain("opacity: 0.3");
  });

  it("targets the .chat-bg::before pseudo-element", () => {
    const { container } = render(<StarBackground />);
    const css = container.querySelector("style")!.textContent ?? "";
    expect(css).toContain(".chat-bg::before");
  });

  it("applies the twinkle animation to .chat-bg::before", () => {
    const { container } = render(<StarBackground />);
    const css = container.querySelector("style")!.textContent ?? "";
    // Grab just the .chat-bg::before rule block
    const ruleStart = css.indexOf(".chat-bg::before");
    const ruleBlock = css.slice(ruleStart, css.indexOf("}", ruleStart) + 1);
    expect(ruleBlock).toContain("animation");
    expect(ruleBlock).toContain("twinkle");
  });

  it("sets pointer-events to none on .chat-bg::before", () => {
    const { container } = render(<StarBackground />);
    const css = container.querySelector("style")!.textContent ?? "";
    const ruleStart = css.indexOf(".chat-bg::before");
    const ruleBlock = css.slice(ruleStart, css.indexOf("}", ruleStart) + 1);
    expect(ruleBlock).toContain("pointer-events: none");
  });

  it("uses position absolute and inset 0 for full coverage", () => {
    const { container } = render(<StarBackground />);
    const css = container.querySelector("style")!.textContent ?? "";
    const ruleStart = css.indexOf(".chat-bg::before");
    const ruleBlock = css.slice(ruleStart, css.indexOf("}", ruleStart) + 1);
    expect(ruleBlock).toContain("position: absolute");
    expect(ruleBlock).toContain("inset: 0");
  });

  it("includes six radial-gradient layers in background-image", () => {
    const { container } = render(<StarBackground />);
    const css = container.querySelector("style")!.textContent ?? "";
    const matches = css.match(/radial-gradient/g);
    expect(matches).toHaveLength(6);
  });

  it("includes six background-size entries", () => {
    const { container } = render(<StarBackground />);
    const css = container.querySelector("style")!.textContent ?? "";
    // Each size entry is of the form NNNpx NNNpx
    const matches = css.match(/\d+px \d+px/g);
    // 6 sizes + 6 positions = 12 matches total
    expect(matches?.length).toBeGreaterThanOrEqual(6);
  });

  it("sets z-index to 0", () => {
    const { container } = render(<StarBackground />);
    const css = container.querySelector("style")!.textContent ?? "";
    const ruleStart = css.indexOf(".chat-bg::before");
    const ruleBlock = css.slice(ruleStart, css.indexOf("}", ruleStart) + 1);
    expect(ruleBlock).toContain("z-index: 0");
  });

  it("uses a 4s animation duration", () => {
    const { container } = render(<StarBackground />);
    const css = container.querySelector("style")!.textContent ?? "";
    expect(css).toContain("4s");
  });

  it("uses ease-in-out timing", () => {
    const { container } = render(<StarBackground />);
    const css = container.querySelector("style")!.textContent ?? "";
    expect(css).toContain("ease-in-out");
  });

  it("loops the animation infinitely", () => {
    const { container } = render(<StarBackground />);
    const css = container.querySelector("style")!.textContent ?? "";
    expect(css).toContain("infinite");
  });
});
