"use client";

/**
 * @file GroupHeader.tsx
 * @description Header bar rendered at the top of a group conversation view.
 * Displays the group name and member count (clicking either toggles the member list),
 * and provides a "Leave group" button.
 */

type Props = {
  name: string | null;
  participantCount: number;
  onToggleMembers: () => void;
  onLeave: () => void;
};

export function GroupHeader({ name, participantCount, onToggleMembers, onLeave }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
      <button
        onClick={onToggleMembers}
        className="text-sm font-semibold transition-colors text-[rgba(220,225,255,0.85)] hover:text-[rgba(148,163,255,0.9)]"
      >
        {name}
        <span className="ml-1.5 text-xs font-normal text-[rgba(148,163,255,0.4)]">
          {participantCount} members
        </span>
      </button>

      <button
        onClick={onLeave}
        className="text-xs font-medium transition-colors text-[rgba(255,100,100,0.6)] hover:text-[rgba(255,100,100,0.9)]"
      >
        Leave group
      </button>
    </div>
  );
}