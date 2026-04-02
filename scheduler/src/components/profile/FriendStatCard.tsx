/**
 * @file FriendStatCard.tsx
 * @description Displays the user's total friend count as an interactive stat card.
 * Toggles the visibility of the friends list panel and reflects the active state
 * through conditional styling aligned with the Lunar Theme.
 */

'use client';

import { Button } from "@/components/ui/Button";
import { Users, ChevronDown, ChevronUp } from "lucide-react";
/**
 * Props for the FriendStatCard component.
 */
interface FriendStatCardProps {
  friendCount: number;
  showFriends: boolean;
  onToggle: () => void;
}

/**
 * Renders the chevron icon reflecting the current friends list visibility.
 *
 * @param {{ showFriends: boolean }} props - Component props.
 * @returns {JSX.Element} An up or down chevron icon.
 */
function ToggleChevron({ showFriends }: { showFriends: boolean }) {
  return showFriends
    ? <ChevronUp size={14} className="text-blue-400" />
    : <ChevronDown size={14} className="text-blue-400" />;
}

/**
 * Displays the total friend count and acts as a toggle button for the friends list.
 * Styled to match the Lunar Theme stat cards.
 *
 * @param {FriendStatCardProps} props - Component props.
 * @returns {JSX.Element} The rendered friend stat card.
 */
export default function FriendStatCard({ friendCount, showFriends, onToggle }: FriendStatCardProps) {
  const activeClass = showFriends ? "border-blue-400/50 bg-blue-500/10" : "";

  return (
    <Button
      onClick={onToggle}
      className={`w-full h-full aspect-square p-6 lunar-card flex flex-col justify-center items-center text-center transition-all hover:border-blue-500/30 ${activeClass}`}
    >
      <div className="bg-blue-500/20 p-3 rounded-full mb-3 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
        <Users size={24} />
      </div>

      <span className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
        {friendCount}
      </span>

      <span className="lunar-label mt-2 flex items-center justify-center gap-1 text-white/60">
        Friends <ToggleChevron showFriends={showFriends} />
      </span>
    </Button>
  );
}