'use client';
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Users, X, UserMinus } from "lucide-react";
import { resolveAvatarSrc } from "@/lib/avatar";

export default function FriendsList({
  friends,
  isOwnProfile,
  onClose,
  onRemoveFriend,
  isPending,
}: {
  friends: any[];
  isOwnProfile: boolean;
  onClose: () => void;
  onRemoveFriend: (id: string, e: React.MouseEvent) => void;
  isPending: boolean;
}) {
  return (
    <div className="lunar-card p-6 animate-in fade-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="lunar-label flex items-center gap-2">
          <Users size={16} className="text-blue-400" />
          {isOwnProfile ? "My Friends" : "Friends"} ({friends?.length || 0})
        </h2>
        <Button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <X size={18} />
        </Button>
      </div>
      {friends && friends.length > 0 ? (
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2 lunar-scroll">
          {friends.map((friend: any) => {
            const avatarSrc = resolveAvatarSrc(friend.pfp);
            return (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <Link href={`/profile/${friend.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-white/10 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={friend.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/60 font-bold">
                        {friend.fname?.[0] || friend.username[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate text-sm">
                      {friend.fname || friend.username} {friend.lname}
                    </p>
                    <p className="text-xs text-blue-400 truncate">@{friend.username}</p>
                  </div>
                </Link>
                {isOwnProfile && (
                  <Button
                    onClick={(e) => onRemoveFriend(friend.id, e)}
                    disabled={isPending}
                    className={`lunar-item-error flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex-shrink-0 ml-2 transition-colors ${
                      isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-red-500/20"
                    }`}
                  >
                    <UserMinus size={12} />
                    <span>Remove</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="lunar-value text-center py-8">
          {isOwnProfile ? "No friends yet. Start adding friends!" : "No friends to show."}
        </p>
      )}
    </div>
  );
}