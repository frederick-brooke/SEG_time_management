'use client';

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  Users, UserPlus, UserCheck, Clock, 
  ChevronDown, ChevronUp, UserMinus, Flag, Star, Zap, Pencil, X
} from "lucide-react";

// Actions
import { sendFriendRequest, removeFriend, cancelFriendRequest } from "../../actions/profile";

// Sub-components
import ReportModal from "components/admin/report-modal";
import EditProfileForm from "components/profile/EditProfileForm";
import FriendsList from "components/profile/FriendsList";
import PendingRequests from "components/profile/PendingRequests";
import StreakCard from "components/profile/StreakCard";
import TaskStatsCard from "components/profile/TaskStatsCard";

/**
 * Formats an ISO date string into DD/MM/YYYY.
 * @param {string} dateString - The raw date string.
 * @return {string} The formatted date.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Handles the logic and UI for sending, canceling, or removing friend requests.
 * @param {Object} props - Component props.
 * @param {any} props.profile - The profile data of the user being viewed.
 * @param {boolean} props.isOwnProfile - True if viewing own profile.
 * @return {JSX.Element | null} The relational action buttons.
 */
function FriendRequestAction({ profile, isOwnProfile }: { profile: any; isOwnProfile: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (isOwnProfile) return null;

  const handleAction = (actionFn: (id: string) => Promise<any>, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    startTransition(async () => { await actionFn(profile.id); });
  };

  if (profile.friendStatus === "FRIENDS") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
          <UserCheck size={18} />
          <span className="font-medium">Friends</span>
        </div>
        <button
          onClick={() => handleAction(removeFriend, 'Are you sure you want to remove this friend?')}
          disabled={isPending}
          className={`flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium transition-colors ${isPending ? "opacity-50" : "hover:bg-red-100"}`}>
          <UserMinus size={16} />
          <span className="text-sm">{isPending ? "Removing..." : "Remove"}</span>
        </button>
      </div>
    );
  }

  if (profile.friendStatus === "REQUEST_SENT") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
          <Clock size={18} />
          <span className="font-medium">Request Pending</span>
        </div>
        <button
          onClick={() => handleAction(cancelFriendRequest)}
          disabled={isPending}
          className={`flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-300 font-medium transition-colors ${isPending ? "opacity-50" : "hover:bg-gray-200"}`}>
          <X size={16} />
          <span className="text-sm">{isPending ? "Canceling..." : "Cancel"}</span>
        </button>
      </div>
    );
  }

  if (profile.friendStatus === "REQUEST_RECEIVED") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
        <Clock size={18} />
        <span className="font-medium">Wants to be Friends</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => handleAction(sendFriendRequest)}
      disabled={isPending}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors ${isPending ? "opacity-50" : "hover:bg-blue-700"}`}>
      <UserPlus size={18} />
      <span>{isPending ? "Sending..." : "Add Friend"}</span>
    </button>
  );
}

interface ProfilePageClientProps {
  profile: any;
  isOwnProfile: boolean;
  rank?: number;
}

/**
 * Main Client Component for the Profile/Dashboard view.
 * Integrates gamification stats, user details, and friend management.
 * @param {ProfilePageClientProps} props - Component props.
 * @return {JSX.Element} The rendered profile page.
 */
export default function ProfilePageClient({ profile, isOwnProfile, rank }: ProfilePageClientProps) {
  const [showFriends, setShowFriends] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ── POINTS / LEVEL MATH ──
  const level = profile.progress?.level ?? 1;
  const totalPoints = profile.progress?.points ?? 0;
  const XP_PER_LEVEL = 100;
  const xpIntoLevel = totalPoints % XP_PER_LEVEL;
  const xpBarWidth = Math.min((xpIntoLevel / XP_PER_LEVEL) * 100, 100);
  const xpToNext = XP_PER_LEVEL - xpIntoLevel;

  const handleRemoveFriendFromList = (friendId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this friend?')) {
      startTransition(async () => { await removeFriend(friendId); });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
      <div className="max-w-5xl w-full mx-auto py-8">

        {/* ── 1. HEADER & BIO ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 flex flex-col md:flex-row gap-8 items-start shadow-sm">
          
          {/* Avatar + Level Badge */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-4xl font-bold text-gray-500 overflow-hidden border-4 border-white shadow-md">
              {profile.pfp ? (
                <img src={profile.pfp} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{profile.fname?.[0] ?? profile.username?.[0] ?? ""}{profile.lname?.[0] ?? ""}</span>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 rounded-xl rotate-12 border-4 border-white flex items-center justify-center shadow-lg">
              <span className="text-black font-black text-xl -rotate-12">{level}</span>
            </div>
          </div>

          {/* Info & Content */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.fname || profile.username} {profile.lname}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-500 font-medium">@{profile.username}</p>
                  {isOwnProfile && (
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                      title="Edit Profile"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>

                {/* XP Progress Bar */}
                <div className="mt-4 max-w-xs">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      Level {level}
                    </span>
                    <span className="text-xs font-bold text-gray-600">{totalPoints} XP total</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div className="h-full bg-yellow-400 transition-all duration-1000 ease-out" style={{ width: `${xpBarWidth}%` }} />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1 font-medium">{xpToNext} XP until Level {level + 1}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <FriendRequestAction profile={profile} isOwnProfile={isOwnProfile} />
                {!isOwnProfile && (
                  <button
                    onClick={() => setShowReport(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-medium rounded-lg border border-red-600 hover:bg-red-600 transition-colors"
                  >
                    <Flag size={16} /> Report User
                  </button>
                )}
              </div>
            </div>

            {showReport && (
              <ReportModal
                reportedUserId={profile.id}
                reportedUsername={profile.username}
                onClose={() => setShowReport(false)}
              />
            )}

            {/* Bio Display */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {isOwnProfile ? "About Me" : "About"}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {profile.bio || (
                  <span className="text-gray-400 italic">
                    {isOwnProfile ? "No bio written yet. Click the pencil icon to add one!" : "No bio yet."}
                  </span>
                )}
              </p>
            </div>

            {/* Edit Profile Form (Rendered conditionally) */}
            {isOwnProfile && isEditing && (
              <EditProfileForm profile={profile} onClose={() => setIsEditing(false)} />
            )}

            <div className="text-sm text-gray-400 mt-2">
              Joined {formatDate(profile.createdAt)}
            </div>
          </div>
        </div>

        {/* ── 2. STATS ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          <StreakCard streak={profile.stats?.streak ?? 0} rank={rank} />

          {/* Friends Toggle */}
          <button
            onClick={() => setShowFriends(!showFriends)}
            className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center transition-colors ${
              showFriends ? "border-orange-300 bg-orange-50/30" : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="bg-orange-50 p-3 rounded-full mb-3 text-orange-600"><Users size={24} /></div>
            <span className="text-4xl font-bold text-gray-900">{profile.stats?.friendCount ?? 0}</span>
            <span className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-1">
              Friends {showFriends ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          <TaskStatsCard stats={profile.stats} />
        </div>

        {/* ── FRIENDS LIST ── */}
        {showFriends && (
          <FriendsList 
            friends={profile.friends} 
            isOwnProfile={isOwnProfile} 
            onClose={() => setShowFriends(false)} 
            onRemoveFriend={handleRemoveFriendFromList}
            isPending={isPending}
          />
        )}

        {/* ── POINTS CARD ── */}
        {(totalPoints > 0 || level > 1) && (
          <div className="mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-400 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md">
                  <Zap size={28} className="text-white fill-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Total Points Earned</p>
                  <p className="text-4xl font-black text-gray-900">{totalPoints.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Level</p>
                  <p className="text-3xl font-black text-yellow-600">{level}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Next Level</p>
                  <p className="text-lg font-bold text-gray-500">{xpToNext} XP away</p>
                  <div className="w-32 h-2 bg-yellow-100 rounded-full overflow-hidden mt-1 border border-yellow-200">
                    <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000" style={{ width: `${xpBarWidth}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PENDING REQUESTS ── */}
        {isOwnProfile && <PendingRequests requests={profile.receivedRequests} />}

      </div>
    </div>
  );
}