"use client";

type Props = {
  name: string | null;
  participantCount: number;
  onToggleMembers: () => void;
  onLeave: () => void;
};

export function GroupHeader({ name, participantCount, onToggleMembers, onLeave }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
      <button
        onClick={onToggleMembers}
        className="text-sm font-semibold text-gray-800 hover:text-purple-600 transition-colors"
      >
        {name}
        <span className="ml-1.5 text-xs text-gray-400 font-normal">
          {participantCount} members
        </span>
      </button>
      <button
        onClick={onLeave}
        className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
      >
        Leave group
      </button>
    </div>
  );
}