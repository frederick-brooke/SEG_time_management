"use client";
import { useRouter } from "next/navigation";

type Participant = {
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; username: string; fname: string | null; pfp: string | null };
};

type Props = {
  conversationId: string;
  participants: Participant[];
  currentUserId: string;
  isAdmin: boolean;
  onAddMember: () => void;
  onRemove: (userId: string, username: string) => void;
  onPromote: (userId: string, currentRole: string) => void;
};

export function MembersPanel({ participants, currentUserId, isAdmin, onAddMember, onRemove, onPromote }: Props) {
  const router = useRouter();

  return (
    <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(148,163,255,0.35)" }}>Members</p>
        {isAdmin && (
          <button
            onClick={onAddMember}
            className="text-xs font-medium transition-colors"
            style={{ color: "rgba(148,163,255,0.6)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,255,0.9)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(148,163,255,0.6)")}
          >
            + Add member
          </button>
        )}
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {participants.map((p) => {
          const isSelf = p.userId === currentUserId;
          return (
            <div key={p.userId} className="flex items-center justify-between gap-2">
              
              {/* Clickable avatar + name navigates to profile */}
              <button
                onClick={() => router.push(`/profile/${p.user.username}`)}
                className="flex items-center gap-2 min-w-0 transition-opacity hover:opacity-75"
              >
                {p.user.pfp ? (
                  <img src={p.user.pfp} className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0"
                    style={{ background: "rgba(88,101,242,0.2)", color: "rgba(148,163,255,0.8)" }}
                  >
                    {p.user.username[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm truncate" style={{ color: "rgba(200,210,230,0.8)" }}>
                  {p.user.fname?.trim() || p.user.username}
                  {isSelf && <span className="ml-1" style={{ color: "rgba(148,163,255,0.35)" }}>(you)</span>}
                </span>
                {p.role === "admin" && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: "rgba(88,101,242,0.15)", color: "rgba(148,163,255,0.7)" }}
                  >
                    Admin
                  </span>
                )}
              </button>

              {isAdmin && !isSelf && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onPromote(p.userId, p.role)}
                    className="text-xs font-medium transition-colors"
                    style={{ color: "rgba(148,163,255,0.5)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,255,0.9)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(148,163,255,0.5)")}
                  >
                    {p.role === "admin" ? "Remove admin" : "Make admin"}
                  </button>
                  <button
                    onClick={() => onRemove(p.userId, p.user.username)}
                    className="text-xs font-medium transition-colors"
                    style={{ color: "rgba(255,100,100,0.5)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,100,100,0.85)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,100,100,0.5)")}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}