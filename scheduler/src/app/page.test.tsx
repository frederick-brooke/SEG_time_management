import { render, screen } from "@testing-library/react";
import Home from "./page"; // Adjust the import path/name if needed

// Mock the child components to isolate the Home component test
jest.mock("@/components/landing/Navbar", () => {
  return function MockNavbar() {
    return <nav data-testid="mock-navbar">Navbar</nav>;
  };
});

// Note: Matching the exact import path used in your file (missing the @/)
jest.mock("components/landing/HeroSection", () => {
  return function MockHeroSection() {
    return <section data-testid="mock-hero">Hero</section>;
  };
});

jest.mock("@/components/landing/FeaturesSection", () => {
  return function MockFeaturesSection() {
    return <section data-testid="mock-features">Features</section>;
  };
});

describe("Landing Page (Home)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the main wrapper with correct styling", () => {
    const { container } = render(<Home />);
    
    // The firstChild is the main wrapper div
    const wrapper = container.firstChild;
    
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass("min-h-screen");
    expect(wrapper).toHaveClass("bg-gray-950");
    expect(wrapper).toHaveClass("text-white");
  });

  it("renders all expected sections", () => {
    render(<Home />);
    
    expect(screen.getByTestId("mock-navbar")).toBeInTheDocument();
    expect(screen.getByTestId("mock-hero")).toBeInTheDocument();
    expect(screen.getByTestId("mock-features")).toBeInTheDocument();
  });
});