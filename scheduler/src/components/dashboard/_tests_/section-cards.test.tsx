import { render, screen } from "@testing-library/react";
import { SectionCards } from "../section-cards"; // Adjust import path if needed

describe("SectionCards Component", () => {
  // ── Tests for the CURRENT state (Cards commented out) ──

  it("renders the wrapper container without crashing", () => {
    const { container } = render(<SectionCards />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeInTheDocument();
    
    // Verify it applies the correct grid layout classes
    expect(wrapper).toHaveClass("grid");
    expect(wrapper).toHaveClass("grid-cols-1");
    expect(wrapper).toHaveClass("gap-4");
  });

  it("currently renders no visible content", () => {
    const { container } = render(<SectionCards />);
    
    // Because the cards are commented out, the wrapper should be completely empty
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  // ── Tests for the FUTURE state (When you uncomment the cards) ──
  // Remove the ".skip" from these tests once you re-enable the cards!

  describe.skip("Future state (Cards enabled)", () => {
    it("renders the To Do List card", () => {
      render(<SectionCards />);
      expect(screen.getByText("To Do List")).toBeInTheDocument();
      expect(screen.getByText("$1,250.00")).toBeInTheDocument();
      expect(screen.getByText("+12.5%")).toBeInTheDocument();
    });

    it("renders the New Customers card", () => {
      render(<SectionCards />);
      expect(screen.getByText("New Customers")).toBeInTheDocument();
      expect(screen.getByText("1,234")).toBeInTheDocument();
      expect(screen.getByText("-20%")).toBeInTheDocument();
    });

    it("renders the Active Accounts card", () => {
      render(<SectionCards />);
      expect(screen.getByText("Active Accounts")).toBeInTheDocument();
      expect(screen.getByText("45,678")).toBeInTheDocument();
    });

    it("renders the Growth Rate card", () => {
      render(<SectionCards />);
      expect(screen.getByText("Growth Rate")).toBeInTheDocument();
      expect(screen.getByText("4.5%")).toBeInTheDocument();
    });
  });
});