"use client";

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

export function MembersPanel({
  participants,
  currentUserId,
  isAdmin,
  onAddMember,
  onRemove,
  onPromote,
}: Props) {
  return (
    <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Members</p>
        {isAdmin && (
          <button
            onClick={onAddMember}
            className="text-xs text-purple-500 hover:text-purple-700 font-medium"
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
              <div className="flex items-center gap-2">
                {p.user.pfp ? (
                  <img src={p.user.pfp} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-xs font-semibold flex items-center justify-center">
                    {p.user.username[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-800">
                  {p.user.fname ?? p.user.username}
                  {isSelf && <span className="text-gray-400 ml-1">(you)</span>}
                </span>
                {p.role === "admin" && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">Admin</span>
                )}
              </div>
              {isAdmin && !isSelf && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPromote(p.userId, p.role)}
                    className="text-xs text-purple-500 hover:text-purple-700 font-medium"
                  >
                    {p.role === "admin" ? "Remove admin" : "Make admin"}
                  </button>
                  <button
                    onClick={() => onRemove(p.userId, p.user.username)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium"
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