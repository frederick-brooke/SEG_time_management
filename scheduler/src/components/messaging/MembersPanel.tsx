"use client";

/**
 * @file MembersPanel.tsx
 * @description Collapsible panel showing all members in a group conversation.
 *
 * Responsibilities:
 * - Displays participant list with roles
 * - Allows admins to add/remove/promote members
 * - Navigates to user profiles
 */

import { useRouter } from "next/navigation";
import Image from "next/image";
import { resolveAvatarSrc } from "@/lib/avatar";

/**
 * Represents a conversation participant.
 */
type Participant = {
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    fname: string | null;
    pfp: string | null;
  };
};

/**
 * Props for MembersPanel component.
 */
type Props = {
  /** ID of the conversation */
  conversationId: string;
  /** List of participants */
  participants: Participant[];
  /** Current logged-in user ID */
  currentUserId: string;
  /** Whether the current user is an admin */
  isAdmin: boolean;
  /** Opens add-member modal */
  onAddMember: () => void;
  /** Removes a user */
  onRemove: (userId: string, username: string) => void;
  /** Toggles admin role */
  onPromote: (userId: string, currentRole: string) => void;
};

/**
 * Reusable avatar component with fallback.
 */
function Avatar({
  src,
  fallback,
  alt,
}: {
  src: string | null;
  fallback: string;
  alt: string;
}) {
  const resolved = resolveAvatarSrc(src);

  if (resolved) {
    return (
      <Image
        src={resolved}
        alt={alt}
        width={28}
        height={28}
        className="w-7 h-7 rounded-full object-cover shrink-0"
      />
    );
  }

  return (
    <div className="w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 bg-[rgba(88,101,242,0.2)] text-[rgba(148,163,255,0.8)]">
      {fallback}
    </div>
  );
}

/**
 * Single member row.
 */
function MemberRow({
  participant,
  currentUserId,
  isAdmin,
  onRemove,
  onPromote,
}: {
  participant: Participant;
  currentUserId: string;
  isAdmin: boolean;
  onRemove: (userId: string, username: string) => void;
  onPromote: (userId: string, role: string) => void;
}) {
  const router = useRouter();
  const isSelf = participant.userId === currentUserId;

  return (
    <div className="flex items-center justify-between gap-2">
      {/* Profile link */}
      <Button
        onClick={() => router.push(`/profile/${participant.user.username}`)}
        className="flex items-center gap-2 min-w-0 transition-opacity hover:opacity-75"
      >
        <Avatar
          src={participant.user.pfp}
          fallback={participant.user.username[0].toUpperCase()}
          alt={participant.user.username}
        />

        <span className="text-sm truncate text-[rgba(200,210,230,0.8)]">
          {participant.user.fname?.trim() || participant.user.username}
          {isSelf && (
            <span className="ml-1 text-[rgba(148,163,255,0.35)]">(you)</span>
          )}
        </span>

        {participant.role === "admin" && (
          <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0 bg-[rgba(88,101,242,0.15)] text-[rgba(148,163,255,0.7)]">
            Admin
          </span>
        )}
      </Button>

      {isAdmin && !isSelf && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => onPromote(participant.userId, participant.role)}
            className="text-xs font-medium transition-colors text-[rgba(148,163,255,0.5)] hover:text-[rgba(148,163,255,0.9)]"
          >
            {participant.role === "admin" ? "Remove admin" : "Make admin"}
          </Button>
          <Button
            onClick={() =>
              onRemove(participant.userId, participant.user.username)
            }
            className="text-xs font-medium transition-colors text-[rgba(255,100,100,0.5)] hover:text-[rgba(255,100,100,0.85)]"
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}

export function MembersPanel({
  participants,
  currentUserId,
  isAdmin,
  onAddMember,
  onRemove,
  onPromote,
}: Props) {
  return (
    <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgba(148,163,255,0.35)]">
          Members
        </p>

        {isAdmin && (
          <Button
            onClick={onAddMember}
            className="text-xs font-medium transition-colors text-[rgba(148,163,255,0.6)] hover:text-[rgba(148,163,255,0.9)]"
          >
            + Add member
          </Button>
        )}
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {participants.map((p) => (
          <MemberRow
            key={p.userId}
            participant={p}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onRemove={onRemove}
            onPromote={onPromote}
          />
        ))}
      </div>
    </div>
  );
}