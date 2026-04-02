"use client";
/**
 * @file AddMemberModal.tsx
 * @description Modal component for adding friends to an existing group conversation.
 * Fetches the current user's friends, filters out existing members, and posts
 * a new member to the conversation via the REST API.
 */
import { useEffect, useState } from "react";
import { resolveAvatarSrc } from "@/lib/avatar";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

type Friend = {
  id: string;
  username: string;
  fname: string | null;
  pfp: string | null;
};

/**
 * Props for the AddMemberModal component.
 * @property conversationId - The ID of the group conversation to add a member to.
 * @property existingMemberIds - IDs of users already in the conversation; used to filter candidates.
 * @property onClose - Callback invoked when the modal should be dismissed.
 * @property onAdded - Callback invoked after a member has been successfully added.
 */
type Props = {
  conversationId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onAdded: () => void;
};

/**
 * Fetches the current user's friends and filters out anyone already
 * in the conversation, returning only addable candidates.
 */
function useAddableFriends(existingMemberIds: string[]): Friend[] {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    // q= with no value returns all friends from the search endpoint
    fetch("/api/user/search?q=")
      .then((r) => r.json())
      .then((data: Friend[]) =>
        setFriends(data.filter((f) => !existingMemberIds.includes(f.id)))
      )
      .catch(console.error);
  }, [existingMemberIds]);

  return friends;
}

/** Renders a friend's avatar image, or a generated initial as a fallback. */
function FriendAvatar({ friend }: { friend: Friend }) {
  const src = resolveAvatarSrc(friend.pfp);

  if (src) {
    return (
      <Image
        src={src}
        alt={friend.username}
        width={28}
        height={28}
        className="w-7 h-7 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center bg-[rgba(88,101,242,0.2)] text-[rgba(148,163,255,0.8)]">
      {friend.username[0].toUpperCase()}
    </div>
  );
}

/**
 * Modal for adding a new member to an existing group conversation.
 * Filters out users who are already members before displaying candidates.
 */
export function AddMemberModal({
  conversationId,
  existingMemberIds,
  onClose,
  onAdded,
}: Props) {
  const friends = useAddableFriends(existingMemberIds);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (userId: string) => {
    // Prevent double-submission
    if (loading) return;
    
    setLoading(true);
    
    try {
      await fetch(`/api/conversations/${conversationId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      onAdded();
      onClose();
    } catch (err) {
      console.error("Failed to add member:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
      <div className="rounded-2xl p-6 w-full max-w-sm mx-4 bg-[rgba(12,16,32,0.98)] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
        <h2 className="text-base font-semibold mb-4 text-[rgba(220,225,255,0.9)]">
          Add Member
        </h2>

        <div className="space-y-0.5 max-h-64 overflow-y-auto rounded-lg border border-white/[0.06]">
          {friends.length === 0 && (
            <p className="text-xs text-center py-6 text-[rgba(148,163,255,0.35)]">
              No friends to add
            </p>
          )}
          {friends.map((f) => (
            <Button
              key={f.id}
              onClick={() => handleAdd(f.id)}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2 transition-colors rounded-lg disabled:opacity-50 hover:bg-white/[0.04]"
            >
              <FriendAvatar friend={f} />
              <span className="text-sm text-[rgba(200,210,230,0.8)]">
                {f.fname || f.username}
              </span>
              <span className="ml-auto text-xs font-medium text-[rgba(148,163,255,0.6)]">
                {loading ? "Adding…" : "Add"}
              </span>
            </Button>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <Button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg transition-colors border border-white/[0.08] text-[rgba(148,163,255,0.6)] hover:bg-white/[0.04]"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}