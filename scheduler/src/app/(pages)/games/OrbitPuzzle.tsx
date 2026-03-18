'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { payGameEntry } from "@/src/app/actions/games";
import { DIFFICULTY_CONFIG, Difficulty } from "@/src/lib/games-config";
import { GoldCoin } from "components/ui/gold-coin";


const ALL_SYMBOLS = ["🪐", "⭐", "🌙", "☄️", "🚀", "👾", "🌌", "💫", "🛸", "🔭", "🌠", "🪨"];

type CardState = { id: number; symbol: string; flipped: boolean; matched: boolean };
type GamePhase = "lobby" | "countdown" | "playing" | "won" | "lost";


function shuffle(pairs: number): CardState[] {
  const syms = ALL_SYMBOLS.slice(0, pairs);
  const deck = [...syms, ...syms];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.map((symbol, id) => ({ id, symbol, flipped: false, matched: false }));
}

export default function OrbitPuzzle({ initialBalance }: { initialBalance: number }) {
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [balance, setBalance] = useState(initialBalance);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderCards, setRenderCards] = useState<CardState[]>([]);

  const cardsRef = useRef<CardState[]>([]);
  const firstPickRef = useRef<number | null>(null);
  const lockedRef = useRef(false);
  const phaseRef = useRef<GamePhase>("lobby");
  const diffRef = useRef<Difficulty>("easy");
  const timeRef = useRef(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { diffRef.current = difficulty; }, [difficulty]);
  useEffect(() => { timeRef.current = timeLeft; }, [timeLeft]);

  const cfg = DIFFICULTY_CONFIG[difficulty];

  function syncCards() {
    setRenderCards([...cardsRef.current]);
  }

  useEffect(() => {
    if (phase !== "playing") return;
    timerInterval.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1;
        timeRef.current = next;
        if (next <= 0) {
          clearInterval(timerInterval.current!);
          setPhase("lost");
          phaseRef.current = "lost";
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerInterval.current!);
  }, [phase]);

  const handleWin = useCallback(() => {
    clearInterval(timerInterval.current!);
    setPhase("won");
    phaseRef.current = "won";
  }, []);

  function onCardClick(idx: number) {
    if (phaseRef.current !== "playing") return;
    if (lockedRef.current) return;

    const cards = cardsRef.current;
    const card = cards[idx];
    if (card.flipped || card.matched) return;

    cards[idx] = { ...card, flipped: true };
    syncCards();

    if (firstPickRef.current === null) {
      firstPickRef.current = idx;
    } else {
      const firstIdx = firstPickRef.current;
      firstPickRef.current = null;
      lockedRef.current = true;
      setMoves(m => m + 1);

      const isMatch = cards[firstIdx].symbol === cards[idx].symbol;

      if (isMatch) {
        setTimeout(() => {
          cardsRef.current[firstIdx] = { ...cardsRef.current[firstIdx], matched: true };
          cardsRef.current[idx]      = { ...cardsRef.current[idx],      matched: true };
          syncCards();
          lockedRef.current = false;
          const allDone = cardsRef.current.every(c => c.matched);
          if (allDone) handleWin();
        }, 400);
      } else {
        setTimeout(() => {
          cardsRef.current[firstIdx] = { ...cardsRef.current[firstIdx], flipped: false };
          cardsRef.current[idx]      = { ...cardsRef.current[idx],      flipped: false };
          syncCards();
          lockedRef.current = false;
        }, 900);
      }
    }
  }

  async function startGame() {
    setError(null);
    setIsProcessing(true);
    try {
      const result = await payGameEntry(diffRef.current);
      setBalance(result.newBalance);

      setPhase("countdown");
      phaseRef.current = "countdown";
      let c = 3;
      setCountdown(c);
      const cd = setInterval(() => {
        c--;
        setCountdown(c);
        if (c === 0) {
          clearInterval(cd);
          const newCfg = DIFFICULTY_CONFIG[diffRef.current];
          const newCards = shuffle(newCfg.pairs);
          cardsRef.current = newCards;
          firstPickRef.current = null;
          lockedRef.current = false;
          setRenderCards([...newCards]);
          setMoves(0);
          setTimeLeft(newCfg.timeLimit);
          timeRef.current = newCfg.timeLimit;
          setPhase("playing");
          phaseRef.current = "playing";
        }
      }, 1000);
    } catch (e: any) {
      setError(e.message);
      setPhase("lobby");
    } finally {
      setIsProcessing(false);
    }
  }

  const timerPct = cfg.timeLimit > 0 ? (timeLeft / cfg.timeLimit) * 100 : 0;
  const timerColor = timerPct > 50 ? "bg-emerald-400" : timerPct > 25 ? "bg-yellow-400" : "bg-red-500";
  const matchedPairs = renderCards.filter(c => c.matched).length / 2;
  const gridCols = difficulty === "hard" ? "grid-cols-6" : "grid-cols-4";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-8 px-4">

      {/* LOBBY */}
      {phase === "lobby" && (
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <div className="text-6xl mb-4">🌌</div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-2">Orbit Puzzle</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Match pairs of cosmic symbols before time runs out. Spend coins to play.
            </p>
          </div>
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 flex items-center gap-3">
              <GoldCoin size={24} />
              <span className="text-2xl font-black text-white">{balance.toLocaleString()}</span>
              <span className="text-gray-400 text-sm">coins</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(([key, c]) => (
              <button key={key} onClick={() => setDifficulty(key)}
                className={`relative rounded-2xl p-5 border-2 transition-all text-left ${
                  difficulty === key ? "border-yellow-400 bg-yellow-400/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}>
                <p className="font-black text-white text-lg mb-3">{c.label}</p>
                <div className="space-y-1 text-xs text-gray-400">
                  <p>🃏 {c.pairs} pairs</p>
                  <p>⏱ {c.timeLimit}s</p>
                  <p className="flex items-center gap-1"><GoldCoin size={14} /> {c.cost} coins to play</p>
                </div>
                {difficulty === key && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-yellow-400" />}
              </button>
            ))}
          </div>
          {error && <div className="mb-4 text-center text-red-400 text-sm font-bold bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{error}</div>}
          <button onClick={startGame} disabled={isProcessing || balance < cfg.cost}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
              balance < cfg.cost ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow-lg shadow-yellow-400/30 hover:scale-[1.02]"}`}>
            {isProcessing ? "Launching..." : balance < cfg.cost ? `Need ${cfg.cost} coins` : `🚀 Launch — ${cfg.cost} coins`}
          </button>
        </div>
      )}

      {/* COUNTDOWN */}
      {phase === "countdown" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-gray-400 text-lg mb-4 font-bold uppercase tracking-widest">Get Ready</p>
          <div className="text-[10rem] font-black text-yellow-400 leading-none animate-pulse">{countdown}</div>
        </div>
      )}

      {/* PLAYING */}
      {phase === "playing" && (
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white">🎯 {matchedPairs}/{cfg.pairs}</div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white">👆 {moves} moves</div>
            <div className={`rounded-xl px-4 py-2 text-sm font-black ${timerPct <= 25 ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-white/10 text-white"}`}>⏱ {timeLeft}s</div>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full mb-6 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
          </div>
          <div className={`grid ${gridCols} gap-3`}>
            {renderCards.map((card, idx) => (
              <button key={card.id} onClick={() => onCardClick(idx)}
                className={`aspect-square rounded-2xl text-3xl font-bold transition-all duration-300 select-none ${
                  card.matched ? "bg-emerald-500/20 border-2 border-emerald-500/50 scale-95 cursor-default"
                  : card.flipped ? "bg-white/20 border-2 border-white/40 scale-105"
                  : "bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-white/30 hover:scale-105 cursor-pointer"}`}>
                {card.flipped || card.matched ? card.symbol : "🌑"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WON */}
      {phase === "won" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-sm mx-auto">
          <div className="text-7xl mb-6">🏆</div>
          <h2 className="text-4xl font-black text-yellow-400 mb-2">Mission Complete!</h2>
          <p className="text-gray-400 mb-8">You matched all {cfg.pairs} pairs in {moves} moves. Well done, Commander!</p>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 mb-8">
            <p className="text-gray-400 text-sm">Current balance</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <GoldCoin size={28} />
              <span className="text-white font-black text-2xl">{balance.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={() => setPhase("lobby")} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">Change Difficulty</button>
            <button onClick={startGame} disabled={isProcessing || balance < cfg.cost} className="flex-1 py-3 rounded-xl bg-yellow-400 text-gray-900 font-black hover:bg-yellow-300 transition-colors disabled:opacity-50">Play Again</button>
          </div>
        </div>
      )}

      {/* LOST */}
      {phase === "lost" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-sm mx-auto">
          <div className="text-7xl mb-6">💥</div>
          <h2 className="text-4xl font-black text-red-400 mb-2">Mission Failed</h2>
          <p className="text-gray-400 mb-8">Time ran out! {matchedPairs}/{cfg.pairs} matched. <br/><span className="text-red-400 font-bold">{cfg.cost} coins lost.</span></p>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 mb-8">
            <p className="text-gray-400 text-sm">Current balance</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <GoldCoin size={28} />
              <span className="text-white font-black text-2xl">{balance.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={() => setPhase("lobby")} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">Back to Lobby</button>
            <button onClick={startGame} disabled={isProcessing || balance < cfg.cost} className="flex-1 py-3 rounded-xl bg-yellow-400 text-gray-900 font-black hover:bg-yellow-300 transition-colors disabled:opacity-50">
              {balance < cfg.cost ? "Not enough coins" : "Try Again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}