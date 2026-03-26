import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import OrbitPuzzle from "@/app/(pages)/games/OrbitPuzzle";
import { payGameEntry } from "@/app/actions/games";

// 1. Mocks 
jest.mock("@/app/actions/games", () => ({
  payGameEntry: jest.fn(),
}));

jest.mock("@/components/ui/gold-coin", () => ({
  GoldCoin: () => <span data-testid="coin-icon" />,
}));

describe("OrbitPuzzle Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the lobby with the initial balance", () => {
    render(<OrbitPuzzle initialBalance={1000} />);
    expect(screen.getByText("Orbit Puzzle")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument(); // Formatted balance
  });

  it("allows selecting a difficulty level", () => {
    render(<OrbitPuzzle initialBalance={1000} />);
    
    const hardButton = screen.getByText("Hard");
    fireEvent.click(hardButton);

    // Assert that the cost updates appropriately on the launch button
    expect(screen.getByRole("button", { name: /Launch — 100 coins/i })).toBeInTheDocument();
  });

  it("prevents launch if the balance is too low", () => {
    // Easy mode costs 25 coins, we give them 10
    render(<OrbitPuzzle initialBalance={10} />);
    
    const launchBtn = screen.getByRole("button", { name: /Need 25 coins/i });
    expect(launchBtn).toBeDisabled();
  });

  it("deducts coins, plays countdown, and starts the game", async () => {
    (payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 975 });

    render(<OrbitPuzzle initialBalance={1000} />);
    
    // Act: Click launch
    fireEvent.click(screen.getByRole("button", { name: /Launch/i }));

    // Wait for the API call to resolve
    await waitFor(() => {
      expect(payGameEntry).toHaveBeenCalledWith("easy");
    });

    // We should now be in the countdown phase
    expect(screen.getByText("Get Ready")).toBeInTheDocument();

    // Act: Advance timers by 3 seconds to skip countdown
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert: We are in the playing phase (cards are rendered)
    expect(screen.getByText("🎯 0/6")).toBeInTheDocument(); // Easy mode has 6 pairs
  });

  it("handles API errors gracefully and returns to lobby", async () => {
    (payGameEntry as jest.Mock).mockRejectedValue(new Error("Insufficient funds in database"));

    render(<OrbitPuzzle initialBalance={1000} />);
    fireEvent.click(screen.getByRole("button", { name: /Launch/i }));

    // Wait for the error to be caught and rendered
    expect(await screen.findByText("Insufficient funds in database")).toBeInTheDocument();
    
    // Ensure we are still in the lobby
    expect(screen.getByText("Orbit Puzzle")).toBeInTheDocument();
  });

  it("fails the game when the timer runs out", async () => {
    (payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 975 });
    render(<OrbitPuzzle initialBalance={1000} />);
    
    fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
    await waitFor(() => expect(payGameEntry).toHaveBeenCalled());

    // Skip countdown
    act(() => { jest.advanceTimersByTime(3000); });

    // Fast forward past the 60-second time limit for Easy mode
    act(() => { jest.advanceTimersByTime(61000); });

    // Assert Loss State
    expect(screen.getByText("Mission Failed")).toBeInTheDocument();
    expect(screen.getByText("975")).toBeInTheDocument(); // Updated balance
  });
});