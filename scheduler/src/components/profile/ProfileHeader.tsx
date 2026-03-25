'use client';

import { Pencil, Star, Flag, UserPlus, UserCheck, Clock, UserMinus, X } from "lucide-react";
import { useState, useTransition } from "react";
import UserAvatar from "@/src/components/profile/UserAvatar";
import { sendFriendRequest, removeFriend, cancelFriendRequest } from "@/src/app/actions/profile";
import ReportModal from "@/src/components/admin/report-modal";

/**
 * Props for the ProfileHeader component.
 */
interface ProfileHeaderProps {
  profile: any;
  isOwnProfile: boolean;
  onEditToggle: () => void;
  level: number;
  xpBarWidth: number;
  xpToNext: number;
}

/**
 * Formats an ISO date string into a standard DD/MM/YYYY format.
 */
function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/**
 * Renders the user's main profile header including avatar, stats, and contextual actions.
 */
export default function ProfileHeader({ profile, isOwnProfile, onEditToggle, level, xpBarWidth, xpToNext }: ProfileHeaderProps) {
  const [isPending, startTransition] = useTransition();
  const [showReport, setShowReport] = useState(false);

  // Executes server actions with an optional confirmation prompt
  const handleAction = (actionFn: (id: string) => Promise<any>, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    startTransition(async () => { await actionFn(profile.id); });
  };

  // Determines the correct relationship action button to display based on current status
  const renderFriendAction = () => {
    if (isOwnProfile) return null;

    if (profile.friendStatus === "FRIENDS") {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/20 text-green-400 rounded border border-green-500/30 text-xs font-semibold">
            <UserCheck size={14} /><span>Friends</span>
          </div>
          <button onClick={() => handleAction(removeFriend, 'Remove this friend?')} disabled={isPending} className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/20 text-red-400 rounded border border-red-500/30 text-xs font-semibold transition-colors ${isPending ? "opacity-50" : "hover:bg-red-500/30"}`}>
            <UserMinus size={12} /><span>{isPending ? "..." : "Remove"}</span>
          </button>
        </div>
      );
    }
    if (profile.friendStatus === "REQUEST_SENT") {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30 text-xs font-semibold">
            <Clock size={14} /><span>Pending</span>
          </div>
          <button onClick={() => handleAction(cancelFriendRequest)} disabled={isPending} className={`flex items-center gap-1 px-2.5 py-1.5 bg-white/10 text-white/70 rounded border border-white/20 text-xs font-semibold ${isPending ? "opacity-50" : "hover:bg-white/20"}`}>
            <X size={12} /><span>Cancel</span>
          </button>
        </div>
      );
    }
    if (profile.friendStatus === "REQUEST_RECEIVED") {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 text-xs font-semibold">
          <Clock size={14} /><span>Wants to be Friends</span>
        </div>
      );
    }
    return (
      <button onClick={() => handleAction(sendFriendRequest)} disabled={isPending} className={`flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 text-xs font-semibold transition-colors ${isPending ? "opacity-50" : "hover:bg-blue-500/30"}`}>
        <UserPlus size={14} /><span>{isPending ? "Sending..." : "Add Friend"}</span>
      </button>
    );
  };

  return (
    <div className="flex items-start gap-5 w-full">
      <div className="relative shrink-0">
        <UserAvatar 
          pfp={profile.pfp} 
          username={profile.username} 
          fname={profile.fname} 
          lname={profile.lname}
          className="w-24 h-24 text-3xl border-4 border-blue-500/20 shadow-lg" 
        />
        <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-yellow-500 rounded-lg rotate-12 border-4 border-[#111629] flex items-center justify-center shadow-md">
          <span className="text-white font-black text-sm -rotate-12">{level}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0 pt-1">
        <div className="mb-3">
          <h1 className="text-2xl font-black text-white truncate drop-shadow-sm leading-none">
            {profile.fname || profile.username} {profile.lname}
          </h1>
          
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-gray-400 font-medium text-sm">@{profile.username}</p>
            {isOwnProfile && (
              <button
                onClick={onEditToggle}
                className="text-gray-500 hover:text-white transition-colors"
                title="Edit Profile"
              >
                <Pencil size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="max-w-[200px] mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.5)]" 
                style={{ width: `${xpBarWidth}%` }} 
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 font-medium pl-4">{xpToNext} XP left until next level</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {renderFriendAction()}
          {!isOwnProfile && (
            <button onClick={() => setShowReport(true)} className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20">
              <Flag size={10} /> Report
            </button>
          )}
          <span className="text-xs text-gray-500 font-medium">Joined {formatDate(profile.createdAt)}</span>
        </div>
      </div>

      {showReport && <ReportModal reportedUserId={profile.id} reportedUsername={profile.username} onClose={() => setShowReport(false)} />}
    </div>
  );
}