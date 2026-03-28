'use client';

/**
 * Orbit Puzzle game component.
 * Implements a memory matching game with multiple difficulty levels, timers, scoring, and coin-based entry system.
 * Contains full game state management, UI views, and gameplay logic in a single client-side module.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { payGameEntry } from "@/app/actions/games";
import { DIFFICULTY_CONFIG, Difficulty } from "@/lib/games-config";
import { GoldCoin } from "@/components/ui/gold-coin";


const ALL_SYMBOLS = ["🪐", "⭐", "🌙", "☄️", "🚀", "👾", "🌌", "💫", "🛸", "🔭", "🌠", "🪨"];

export type CardState = { id: number; symbol: string; flipped: boolean; matched: boolean };
export type GamePhase = "lobby" | "countdown" | "playing" | "won" | "lost";

/**
 * Generates a randomized deck of paired cards.
 * @param {number} pairs - The number of matching pairs required for the chosen difficulty.
 * @returns {CardState[]} An array of strictly typed, shuffled card objects.
 */
function generateDeck(pairs: number): CardState[] {
  const syms = ALL_SYMBOLS.slice(0, pairs);
  const deck = [...syms, ...syms];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.map((symbol, id) => ({ id, symbol, flipped: false, matched: false }));
}

/**
 * Orchestrates the Orbit Puzzle game.
 * Encapsulates all timers, refs, and API mutations to keep the UI strictly declarative.
 * @param {number} initialBalance - The user's starting coin balance.
 * @returns {Object} Reactive state and bound interaction handlers for the view.
 */
function useGameController(initialBalance: number) {
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [balance, setBalance] = useState(initialBalance);
  const [cards, setCards] = useState<CardState[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutable refs to bypass stale closures in timeouts/ intervals
  const stateRef = useRef({ phase: "lobby", cards: [] as CardState[], firstPick: null as number | null, locked: false });

  const syncCards = (newCards: CardState[]) => {
    stateRef.current.cards = newCards;
    setCards([...newCards]);
  };

  const handleWin = useCallback(() => {
    setPhase("won");
    stateRef.current.phase = "won";
  }, []);

  const handleMatch = (idx1: number, idx2: number) => {
    setTimeout(() => {
      const c = stateRef.current.cards;
      c[idx1].matched = true;
      c[idx2].matched = true;
      syncCards(c);
      stateRef.current.locked = false;
      if (c.every(card => card.matched)) handleWin();
    }, 400);
  };

  const handleMismatch = (idx1: number, idx2: number) => {
    setTimeout(() => {
      const c = stateRef.current.cards;
      c[idx1].flipped = false;
      c[idx2].flipped = false;
      syncCards(c);
      stateRef.current.locked = false;
    }, 900);
  };

  const onCardClick = useCallback((idx: number) => {
    if (stateRef.current.phase !== "playing" || stateRef.current.locked) return;
    
    const currentCards = stateRef.current.cards;
    if (currentCards[idx].flipped || currentCards[idx].matched) return;

    currentCards[idx].flipped = true;
    syncCards(currentCards);

    if (stateRef.current.firstPick === null) {
      stateRef.current.firstPick = idx;
      return;
    }

    const firstIdx = stateRef.current.firstPick;
    stateRef.current.firstPick = null;
    stateRef.current.locked = true;
    setMoves(m => m + 1);

    if (currentCards[firstIdx].symbol === currentCards[idx].symbol) {
      handleMatch(firstIdx, idx);
    } else {
      handleMismatch(firstIdx, idx);
    }
  }, [handleWin]);

  const startGame = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      const { newBalance } = await payGameEntry(difficulty);
      setBalance(newBalance);
      startCountdownSequence();
    } catch (e: any) {
      setError(e.message);
      setPhase("lobby");
    } finally {
      setIsProcessing(false);
    }
  };

  const startCountdownSequence = () => {
    setPhase("countdown");
    let c = 3;
    setCountdown(c);
    const cd = setInterval(() => {
      setCountdown(--c);
      if (c === 0) {
        clearInterval(cd);
        initializeBoard();
      }
    }, 1000);
  };

  const initializeBoard = () => {
    const cfg = DIFFICULTY_CONFIG[difficulty];
    syncCards(generateDeck(cfg.pairs));
    stateRef.current = { phase: "playing", cards: stateRef.current.cards, firstPick: null, locked: false };
    setMoves(0);
    setTimeLeft(cfg.timeLimit);
    setPhase("playing");
  };

  // Play Timer
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t - 1 <= 0) {
          clearInterval(timer);
          setPhase("lost");
          stateRef.current.phase = "lost";
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  return {
    phase, difficulty, balance, cards, moves, timeLeft, countdown, isProcessing, error,
    setPhase, setDifficulty, startGame, onCardClick,
    cfg: DIFFICULTY_CONFIG[difficulty]
  };
}

/**
 * Renders the initial configuration screen.
 */
const LobbyView = ({ ctrl }: { ctrl: ReturnType<typeof useGameController> }) => (
  <div className="w-full max-w-2xl text-center">
    <div className="text-6xl mb-4">🌌</div>
    <h2 className="text-4xl font-black text-white tracking-tight mb-2">Orbit Puzzle</h2>
    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-10">Match pairs of cosmic symbols before time runs out.</p>
    
    <div className="flex justify-center mb-8">
      <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 flex items-center gap-3">
        <GoldCoin size={24} />
        <span className="text-2xl font-black text-white">{ctrl.balance.toLocaleString()}</span>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-8">
      {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(([key, c]) => (
        <button key={key} onClick={() => ctrl.setDifficulty(key)} className={`relative rounded-2xl p-5 border-2 text-left transition-all ${ctrl.difficulty === key ? "border-yellow-400 bg-yellow-400/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}>
          <p className="font-black text-white text-lg mb-3">{c.label}</p>
          <div className="space-y-1 text-xs text-gray-400"><p>🃏 {c.pairs} pairs</p><p>⏱ {c.timeLimit}s</p><p>💰 {c.cost} coins</p></div>
          {ctrl.difficulty === key && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-yellow-400" />}
        </button>
      ))}
    </div>

    {ctrl.error && <div className="mb-4 text-red-400 font-bold bg-red-500/10 rounded-xl px-4 py-3">{ctrl.error}</div>}
    
    <button onClick={ctrl.startGame} disabled={ctrl.isProcessing || ctrl.balance < ctrl.cfg.cost} className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${ctrl.balance < ctrl.cfg.cost ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-yellow-400 text-gray-900 hover:bg-yellow-300"}`}>
      {ctrl.isProcessing ? "Launching..." : ctrl.balance < ctrl.cfg.cost ? `Need ${ctrl.cfg.cost} coins` : `🚀 Launch — ${ctrl.cfg.cost} coins`}
    </button>
  </div>
);

/**
 * Renders the active grid and timer.
 */
const PlayingView = ({ ctrl }: { ctrl: ReturnType<typeof useGameController> }) => {
  const pct = ctrl.cfg.timeLimit > 0 ? (ctrl.timeLeft / ctrl.cfg.timeLimit) * 100 : 0;
  const timerColor = pct > 50 ? "bg-emerald-400" : pct > 25 ? "bg-yellow-400" : "bg-red-500";
  const matched = ctrl.cards.filter(c => c.matched).length / 2;

  return (
    <div className="w-full max-w-2xl">
      <div className="flex justify-between mb-6">
        <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white">🎯 {matched}/{ctrl.cfg.pairs}</div>
        <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white">👆 {ctrl.moves} moves</div>
        <div className={`rounded-xl px-4 py-2 text-sm font-black ${pct <= 25 ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-white/10 text-white"}`}>⏱ {ctrl.timeLeft}s</div>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full mb-6 overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${timerColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`grid ${ctrl.difficulty === "hard" ? "grid-cols-6" : "grid-cols-4"} gap-3`}>
        {ctrl.cards.map((c, idx) => (
          <button key={c.id} onClick={() => ctrl.onCardClick(idx)} className={`aspect-square rounded-2xl text-3xl font-bold transition-all duration-300 select-none ${c.matched ? "bg-emerald-500/20 border-emerald-500/50 scale-95" : c.flipped ? "bg-white/20 border-white/40 scale-105" : "bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105 border-2"}`}>
            {c.flipped || c.matched ? c.symbol : "🌑"}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Unified component for rendering both victory and defeat states.
 */
const ResultView = ({ ctrl }: { ctrl: ReturnType<typeof useGameController> }) => {
  const isWin = ctrl.phase === "won";
  const matched = ctrl.cards.filter(c => c.matched).length / 2;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-sm mx-auto">
      <div className="text-7xl mb-6">{isWin ? "🏆" : "💥"}</div>
      <h2 className={`text-4xl font-black mb-2 ${isWin ? "text-yellow-400" : "text-red-400"}`}>{isWin ? "Mission Complete!" : "Mission Failed"}</h2>
      <p className="text-gray-400 mb-8">
        {isWin ? `Matched all ${ctrl.cfg.pairs} pairs in ${ctrl.moves} moves.` : `Time ran out! ${matched}/${ctrl.cfg.pairs} matched.`}
      </p>
      
      <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 mb-8">
        <p className="text-gray-400 text-sm">Current balance</p>
        <div className="flex justify-center gap-2 mt-1"><GoldCoin size={28} /><span className="text-white font-black text-2xl">{ctrl.balance.toLocaleString()}</span></div>
      </div>

      <div className="flex gap-3 w-full">
        <button onClick={() => ctrl.setPhase("lobby")} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20">Lobby</button>
        <button onClick={ctrl.startGame} disabled={ctrl.isProcessing || ctrl.balance < ctrl.cfg.cost} className="flex-1 py-3 rounded-xl bg-yellow-400 text-gray-900 font-black hover:bg-yellow-300 disabled:opacity-50">Play Again</button>
      </div>
    </div>
  );
};

/**
 * Main Orbit Puzzle view. Delegates all logic to 'useGameController'.
 * Ensures pure component rendering based strictly on the 'phase' state.
 * @param {number} initialBalance - Server-provided starting balance.
 */
export default function OrbitPuzzle({ initialBalance }: { initialBalance: number }) {
  const ctrl = useGameController(initialBalance);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-8 px-4">
      {ctrl.phase === "lobby" && <LobbyView ctrl={ctrl} />}
      {ctrl.phase === "countdown" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-gray-400 text-lg mb-4 font-bold uppercase tracking-widest">Get Ready</p>
          <div className="text-[10rem] font-black text-yellow-400 leading-none animate-pulse">{ctrl.countdown}</div>
        </div>
      )}
      {ctrl.phase === "playing" && <PlayingView ctrl={ctrl} />}
      {(ctrl.phase === "won" || ctrl.phase === "lost") && <ResultView ctrl={ctrl} />}
    </div>
  );
}