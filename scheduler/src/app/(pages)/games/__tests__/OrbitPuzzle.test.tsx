/**
 * Testing for Orbit Puzzle page.
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import OrbitPuzzle from "../OrbitPuzzle";
import { payGameEntry } from "@/app/actions/games";
import { DIFFICULTY_CONFIG } from "@/lib/games-config";

// Mocks

jest.mock("@/app/actions/games", () => ({
	payGameEntry: jest.fn(),
}));

jest.mock("@/components/ui/GoldCoin", () => ({
	GoldCoin: () => <span data-testid="gold-coin">🪙</span>,
}));

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
		jest.restoreAllMocks();
	});

	const flushPromises = async () => {
		await act(async () => {
			await Promise.resolve();
		});
	};

	it("renders the lobby with initial balance", () => {
		render(<OrbitPuzzle initialBalance={1000} />);
		expect(screen.getByText("Orbit Puzzle")).toBeInTheDocument();
		expect(screen.getByText("1,000")).toBeInTheDocument();
	});

	it("allows selecting different difficulties", () => {
		render(<OrbitPuzzle initialBalance={1000} />);

		const mediumBtn = screen.getByText("Medium").closest("button");
		fireEvent.click(mediumBtn!);

		expect(
			screen.getByRole("button", { name: /Launch — 250 coins/i }),
		).toBeInTheDocument();
	});

	it("disables the launch button if balance is insufficient", () => {
		render(<OrbitPuzzle initialBalance={50} />);
		const btn = screen.getByRole("button", { name: /Need 100 coins/i });
		expect(btn).toBeDisabled();
	});

	it("displays an error message if payment fails", async () => {
		(payGameEntry as jest.Mock).mockRejectedValue(
			new Error("Insufficient funds API error"),
		);
		render(<OrbitPuzzle initialBalance={1000} />);

		fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
		await flushPromises();

		expect(
			screen.getByText("Insufficient funds API error"),
		).toBeInTheDocument();
	});

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
		expect(cards.length).toBe(4);
		expect(screen.getByText(/⏱ 30s/i)).toBeInTheDocument();
	});

	it("flips cards and handles a MISMATCH correctly", async () => {
		jest.spyOn(Math, "random").mockReturnValue(0);

		(payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
		render(<OrbitPuzzle initialBalance={1000} />);

		fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
		await flushPromises();

		act(() => {
			jest.advanceTimersByTime(3000);
		});

		const cards = screen.getAllByRole("button");

		fireEvent.click(cards[0]);
		fireEvent.click(cards[1]);

		expect(cards[0].textContent).toBe("⭐");
		expect(cards[1].textContent).toBe("🪐");

		act(() => {
			jest.advanceTimersByTime(900);
		});

		expect(cards[0].textContent).toBe("🌑");
		expect(cards[1].textContent).toBe("🌑");
		expect(screen.getByText("👆 1 moves")).toBeInTheDocument();
	});

	it("handles a MATCH correctly and triggers Game Won", async () => {
		jest.spyOn(Math, "random").mockReturnValue(0);

		(payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
		render(<OrbitPuzzle initialBalance={1000} />);

		fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
		await flushPromises();

		act(() => {
			jest.advanceTimersByTime(3000);
		});

		const cards = screen.getAllByRole("button");

		fireEvent.click(cards[0]);
		fireEvent.click(cards[2]);

		act(() => {
			jest.advanceTimersByTime(400);
		});

		fireEvent.click(cards[1]);
		fireEvent.click(cards[3]);

		act(() => {
			jest.advanceTimersByTime(400);
		});

		expect(screen.getByText("Mission Complete!")).toBeInTheDocument();
		expect(
			screen.getByText(/Matched all 2 pairs in 2 moves/i),
		).toBeInTheDocument();
	});

	it("triggers Game Over when time runs out and allows returning to lobby", async () => {
		(payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
		render(<OrbitPuzzle initialBalance={1000} />);

		fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
		await flushPromises();

		act(() => {
			jest.advanceTimersByTime(3000);
		});
		act(() => {
			jest.advanceTimersByTime(30000);
		});

		expect(screen.getByText("Mission Failed")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Lobby" }));
		expect(screen.getByText("Orbit Puzzle")).toBeInTheDocument();
	});

	it("ignores clicks while the board is locked after a mismatch", async () => {
		jest.spyOn(Math, "random").mockReturnValue(0);

		(payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
		render(<OrbitPuzzle initialBalance={1000} />);

		fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
		await flushPromises();

		act(() => {
			jest.advanceTimersByTime(3000);
		});

		const cards = screen.getAllByRole("button");

		fireEvent.click(cards[0]);
		fireEvent.click(cards[1]);
		fireEvent.click(cards[2]);

		expect(cards[2].textContent).toBe("🌑");

		act(() => {
			jest.advanceTimersByTime(900);
		});
	});

	it("ignores clicking a card that is already flipped", async () => {
		jest.spyOn(Math, "random").mockReturnValue(0);

		(payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
		render(<OrbitPuzzle initialBalance={1000} />);

		fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
		await flushPromises();

		act(() => {
			jest.advanceTimersByTime(3000);
		});

		const cards = screen.getAllByRole("button");

		fireEvent.click(cards[0]);
		fireEvent.click(cards[0]);

		expect(screen.getByText("👆 0 moves")).toBeInTheDocument();
		expect(cards[0].textContent).not.toBe("🌑");
	});

	it("ignores clicking a card that is already matched", async () => {
		jest.spyOn(Math, "random").mockReturnValue(0);

		(payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
		render(<OrbitPuzzle initialBalance={1000} />);

		fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
		await flushPromises();

		act(() => {
			jest.advanceTimersByTime(3000);
		});

		const cards = screen.getAllByRole("button");

		fireEvent.click(cards[0]);
		fireEvent.click(cards[2]);

		act(() => {
			jest.advanceTimersByTime(400);
		});

		expect(screen.getByText("🎯 1/2")).toBeInTheDocument();

		fireEvent.click(cards[0]);
		expect(screen.getByText("👆 1 moves")).toBeInTheDocument();
	});

	it("renders a 6-column grid on hard difficulty", async () => {
		jest.spyOn(Math, "random").mockReturnValue(0);

		(payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 500 });
		render(<OrbitPuzzle initialBalance={1000} />);

		fireEvent.click(screen.getByText("Hard"));
		fireEvent.click(
			screen.getByRole("button", { name: /Launch — 500 coins/i }),
		);

		await flushPromises();

		act(() => {
			jest.advanceTimersByTime(3000);
		});

		const hardCard = screen.getAllByRole("button", { name: "🌑" })[0];
		const grid = hardCard.parentElement;

		expect(screen.getAllByRole("button", { name: "🌑" })).toHaveLength(20);
		expect(grid).toHaveClass("grid-cols-6");
	});

	it("shows yellow timer state when time is between 25% and 50%", async () => {
		(payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
		render(<OrbitPuzzle initialBalance={1000} />);

		fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
		await flushPromises();

		act(() => {
			jest.advanceTimersByTime(3000);
		});

		act(() => {
			jest.advanceTimersByTime(16000);
		});

		expect(screen.getByText(/⏱ 14s/i)).toBeInTheDocument();

		const timerText = screen.getByText(/⏱ 14s/i);
		expect(timerText).toHaveClass("bg-white/10", "text-white");
	});

	it("shows red warning timer state when time is 25% or less", async () => {
		(payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });
		render(<OrbitPuzzle initialBalance={1000} />);

		fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
		await flushPromises();

		act(() => {
			jest.advanceTimersByTime(3000);
		});

		act(() => {
			jest.advanceTimersByTime(23000);
		});

		const timerText = screen.getByText(/⏱ 7s/i);
		expect(timerText).toHaveClass(
			"bg-red-500/20",
			"text-red-400",
			"animate-pulse",
		);
	});

	it("falls back to 0 percent when timeLimit is 0", async () => {
		const config = DIFFICULTY_CONFIG as any;
		const originalEasy = { ...config.easy };

		try {
			config.easy = {
				...config.easy,
				timeLimit: 0,
			};

			(payGameEntry as jest.Mock).mockResolvedValue({ newBalance: 900 });

			render(<OrbitPuzzle initialBalance={1000} />);

			fireEvent.click(screen.getByRole("button", { name: /Launch/i }));
			await flushPromises();

			act(() => {
				jest.advanceTimersByTime(3000);
			});

			expect(screen.getByText(/⏱ 0s/i)).toBeInTheDocument();
		} finally {
			config.easy = originalEasy;
		}
	});
});