/**
 * Testing for home page.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "../app/page";

// Mock landing components
jest.mock("@/components/landing/Navbar", () => ({
  __esModule: true,
  default: () => <nav data-testid="mock-navbar">Navbar</nav>,
}));

jest.mock("components/landing/HeroSection", () => ({
  __esModule: true,
  default: () => <section data-testid="mock-hero-section">HeroSection</section>,
}));

jest.mock("@/components/landing/FeaturesSection", () => ({
  __esModule: true,
  default: () => (
    <section data-testid="mock-features-section">FeaturesSection</section>
  ),
}));

// Tests

describe("Home (page.tsx)", () => {
  it("renders without crashing", () => {
    render(<Home />);
    expect(document.body).toBeTruthy();
  });

  it("renders the Navbar component", () => {
    render(<Home />);
    expect(screen.getByTestId("mock-navbar")).toBeInTheDocument();
  });

  it("renders the HeroSection component", () => {
    render(<Home />);
    expect(screen.getByTestId("mock-hero-section")).toBeInTheDocument();
  });

  it("renders the FeaturesSection component", () => {
    render(<Home />);
    expect(screen.getByTestId("mock-features-section")).toBeInTheDocument();
  });

  it("renders the outer wrapper with correct classes", () => {
    const { container } = render(<Home />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("min-h-screen");
    expect(wrapper).toHaveClass("bg-gray-950");
    expect(wrapper).toHaveClass("text-white");
  });

  it("renders all three sections in the correct order", () => {
    const { container } = render(<Home />);
    const children = container.firstChild?.childNodes;
    expect(children?.length).toBe(3);
    expect((children?.[0] as HTMLElement).dataset.testid).toBe("mock-navbar");
    expect((children?.[1] as HTMLElement).dataset.testid).toBe(
      "mock-hero-section"
    );
    expect((children?.[2] as HTMLElement).dataset.testid).toBe(
      "mock-features-section"
    );
  });
});
