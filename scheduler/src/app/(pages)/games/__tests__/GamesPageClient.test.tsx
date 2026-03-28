/**
 * Testing for Games Page Client.
 */
import { render, screen } from "@testing-library/react";
import GamesPageClient from "../GamesPageClient";

// Mocks
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

// Tests

describe("GamesPageClient Orchestrator", () => {
  it("renders the presentational Mission Control header", () => {
    const testBalance = 500;

    render(<GamesPageClient initialBalance={testBalance} />);

    expect(screen.getByText("🎮 Mini Games")).toBeInTheDocument();
    expect(screen.getByText("Mission Control")).toBeInTheDocument();
    expect(screen.getByText(/Spend your points/i)).toBeInTheDocument();
  });

  it("wraps the entire layout within the LunarThemeWrapper", () => {
    const testBalance = 500;

    render(<GamesPageClient initialBalance={testBalance} />);

    const wrapper = screen.getByTestId("lunar-theme-wrapper");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toContainElement(screen.getByText("Mission Control"));
  });

  it("correctly delegates the initialBalance prop to the OrbitPuzzle component", () => {
    const testBalance = 1337;

    render(<GamesPageClient initialBalance={testBalance} />);

    const puzzleComponent = screen.getByTestId("orbit-puzzle");
    expect(puzzleComponent).toBeInTheDocument();
    expect(puzzleComponent).toHaveAttribute("data-balance", "1337");
  });
});