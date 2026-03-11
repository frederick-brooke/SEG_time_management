"use client";

type Props = {
  value: string;
  sending: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
};

export function MessageInput({ value, sending, onChange, onKeyDown, onSend }: Props) {
  return (
    <div
      className="px-4 py-3"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-2.5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <input
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Message..."
          disabled={sending}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "rgba(210,220,255,0.85)", caretColor: "rgba(99,111,255,0.8)" }}
        />
        <button
          onClick={onSend}
          disabled={sending || !value.trim()}
          className="text-sm font-medium transition-colors disabled:opacity-30"
          style={{ color: value.trim() ? "rgba(148,163,255,0.8)" : "rgba(148,163,255,0.3)" }}
          onMouseEnter={e => { if (value.trim()) e.currentTarget.style.color = "rgba(148,163,255,1)"; }}
          onMouseLeave={e => { if (value.trim()) e.currentTarget.style.color = "rgba(148,163,255,0.8)"; }}
        >
          Send
        </button>
      </div>
    </div>
  );
}