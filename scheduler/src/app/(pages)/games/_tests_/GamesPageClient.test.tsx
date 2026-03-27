import { render, screen } from "@testing-library/react";
import GamesPageClient from "../GamesPageClient";

// 1. Strict Dependency Mocks 

// Mock the theme wrapper to simply render its children so we can verify structure
jest.mock("@/components/layout/LunarThemeWrapper", () => {
  return function MockLunarThemeWrapper({ children }: { children: React.ReactNode }) {
    return <div data-testid="lunar-theme-wrapper">{children}</div>;
  };
});

// Mock the complex game logic so we only test the prop delegation in this suite
jest.mock("../OrbitPuzzle", () => {
  return function MockOrbitPuzzle({ initialBalance }: { initialBalance: number }) {
    return <div data-testid="orbit-puzzle" data-balance={initialBalance} />;
  };
});

describe("GamesPageClient Orchestrator", () => {
  
  it("renders the presentational Mission Control header", () => {
    // Arrange
    const testBalance = 500;

    // Act
    render(<GamesPageClient initialBalance={testBalance} />);

    // Assert
    expect(screen.getByText("🎮 Mini Games")).toBeInTheDocument();
    expect(screen.getByText("Mission Control")).toBeInTheDocument();
    expect(screen.getByText(/Spend your points/i)).toBeInTheDocument();
  });

  it("wraps the entire layout within the LunarThemeWrapper", () => {
    // Arrange
    const testBalance = 500;

    // Act
    render(<GamesPageClient initialBalance={testBalance} />);

    // Assert
    const wrapper = screen.getByTestId("lunar-theme-wrapper");
    expect(wrapper).toBeInTheDocument();
    // Ensure the header is rendered inside the wrapper
    expect(wrapper).toContainElement(screen.getByText("Mission Control"));
  });

  it("correctly delegates the initialBalance prop to the OrbitPuzzle component", () => {
    // Arrange
    const testBalance = 1337;

    // Act
    render(<GamesPageClient initialBalance={testBalance} />);

    // Assert
    const puzzleComponent = screen.getByTestId("orbit-puzzle");
    expect(puzzleComponent).toBeInTheDocument();
    
    // Verify the exact value was passed down through the mock's data attribute
    expect(puzzleComponent).toHaveAttribute("data-balance", "1337");
  });
});