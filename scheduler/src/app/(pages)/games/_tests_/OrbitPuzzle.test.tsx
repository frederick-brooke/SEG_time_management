import { render, screen, fireEvent, act } from "@testing-library/react";
import OrbitPuzzle from "../OrbitPuzzle"; // Adjust path as needed
import { payGameEntry } from "@/app/actions/games";

// 1. Mock External Dependencies
jest.mock("@/app/actions/games", () => ({
  payGameEntry: jest.fn(),
}));

jest.mock("@/components/ui/gold-coin", () => ({
  GoldCoin: () => <span data-testid="gold-coin">🪙</span>,
}));

// Mock the config to make tests completely predictable
jest.mock("@/lib/games-config", () => ({
  DIFFICULTY_CONFIG: {
    easy: { label: "Easy", pairs: 2, timeLimit: 30, cost: 100 }, 
    medium: { label: "Medium", pairs: 6, timeLimit: 45, cost: 250 },
    hard: { label: "Hard", pairs: 10, timeLimit: 60, cost: 500 },
  },
}));

describe("Orbit Puzzle Game", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks(); // Restores Math.random if we mocked it
  });

  const flushPromises = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  // --- LOBBY & SETUP TESTS ---

  it("renders the lobby with initial balance", () => {
    render(<OrbitPuzzle initialBalance={1000} />);
    expect(screen.getByText("Orbit Puzzle")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
  });

  it("allows selecting different difficulties", () => {
    render(<OrbitPuzzle initialBalance={1000} />);
    
    const mediumBtn = screen.getByText("Medium").closest("button");
    fireEvent.click(mediumBtn!);
    
    // The launch button should update to reflect the medium cost
    expect(screen.getByRole("button", { name: /Launch — 250 coins/i })).toBeInTheDocument();
  });

  it("disables the launch button if balance is insufficient", () => {
    render(<OrbitPuzzle initialBalance={50} />); 
    const btn = screen.getByRole("button", { name: /Need 100 coins/i });
    expect(btn).toBeDisabled();
  });

  it("displays an error message if payment fails", async () => {
    (payGameEntry as jest.Mock).mockRejectedValue(new Error("Insufficient funds API error"));
    render(<OrbitPuzzle initialBalance={1000} />);

    fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
    await flushPromises();

    expect(screen.getByText("Insufficient funds API error")).toBeInTheDocument();
  });

  // --- COUNTDOWN & TRANSITION TESTS ---

  it("starts the countdown after a successful payment and transitions to playing", async () => {
    (payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
    render(<OrbitPuzzle initialBalance={1000} />);

    fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
    await flushPromises();

    expect(screen.getByText("Get Ready")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const cards = screen.getAllByRole("button", { name: "🌑" });
    expect(cards.length).toBe(4); // Easy mode = 2 pairs = 4 cards
    expect(screen.getByText(/⏱ 30s/i)).toBeInTheDocument();
  });

  // --- GAMEPLAY TESTS ---

  it("flips cards and handles a MISMATCH correctly", async () => {
    // Mock Math.random to always return 0. 
    // This makes our Fisher-Yates shuffle strictly predictable.
    // Resulting array will always be: ["⭐", "🪐", "⭐", "🪐"]
    jest.spyOn(Math, 'random').mockReturnValue(0);
    
    (payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
    render(<OrbitPuzzle initialBalance={1000} />);

    fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
    await flushPromises();
    act(() => { jest.advanceTimersByTime(3000); }); // Skip countdown

    const cards = screen.getAllByRole("button");
    
    // Click card 0 ("⭐") and card 1 ("🪐")
    fireEvent.click(cards[0]);
    fireEvent.click(cards[1]);

    expect(cards[0].textContent).toBe("⭐");
    expect(cards[1].textContent).toBe("🪐");

    // Wait for the mismatch timeout (900ms)
    act(() => { jest.advanceTimersByTime(900); });

    // Cards should be face down again
    expect(cards[0].textContent).toBe("🌑");
    expect(cards[1].textContent).toBe("🌑");
    
    // Moves counter should increment
    expect(screen.getByText("👆 1 moves")).toBeInTheDocument();
  });

  it("handles a MATCH correctly and triggers Game Won", async () => {
    // Layout: ["⭐", "🪐", "⭐", "🪐"]
    jest.spyOn(Math, 'random').mockReturnValue(0);
    
    (payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
    render(<OrbitPuzzle initialBalance={1000} />);

    fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
    await flushPromises();
    act(() => { jest.advanceTimersByTime(3000); }); // Skip countdown

    const cards = screen.getAllByRole("button");

    // Click card 0 and 2 (both "⭐")
    fireEvent.click(cards[0]);
    fireEvent.click(cards[2]);

    // Wait for the match timeout (400ms)
    act(() => { jest.advanceTimersByTime(400); });

    // Click card 1 and 3 (both "🪐")
    fireEvent.click(cards[1]);
    fireEvent.click(cards[3]);

    act(() => { jest.advanceTimersByTime(400); });

    // Verify win screen
    expect(screen.getByText("Mission Complete!")).toBeInTheDocument();
    expect(screen.getByText(/Matched all 2 pairs in 2 moves/i)).toBeInTheDocument();
  });

  // --- ENDGAME TESTS ---

  it("triggers Game Over when time runs out and allows returning to lobby", async () => {
    (payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
    render(<OrbitPuzzle initialBalance={1000} />);

    fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
    await flushPromises();
    act(() => { jest.advanceTimersByTime(3000); }); // Skip countdown

    // Fast-forward 30 seconds (mocked Easy time limit)
    act(() => { jest.advanceTimersByTime(30000); });

    expect(screen.getByText("Mission Failed")).toBeInTheDocument();
    
    // Click the lobby button
    fireEvent.click(screen.getByRole("button", { name: "Lobby" }));
    
    // Verify we are back
    expect(screen.getByText("Orbit Puzzle")).toBeInTheDocument();
  });
});