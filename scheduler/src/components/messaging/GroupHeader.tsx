"use client";

type Props = {
  name: string | null;
  participantCount: number;
  onToggleMembers: () => void;
  onLeave: () => void;
};

export function GroupHeader({ name, participantCount, onToggleMembers, onLeave }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <button
        onClick={onToggleMembers}
        className="text-sm font-semibold transition-colors"
        style={{ color: "rgba(220,225,255,0.85)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,255,0.9)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(220,225,255,0.85)")}
      >
        {name}
        <span className="ml-1.5 text-xs font-normal" style={{ color: "rgba(148,163,255,0.4)" }}>
          {participantCount} members
        </span>
      </button>
      <button
        onClick={onLeave}
        className="text-xs font-medium transition-colors"
        style={{ color: "rgba(255,100,100,0.6)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,100,100,0.9)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,100,100,0.6)")}
      >
        Leave group
      </button>
    </div>
  );
}