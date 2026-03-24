'use client';

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  Users, UserPlus, UserCheck, Clock, ChevronDown, ChevronUp,
  UserMinus, Flag, Star, Pencil, X, Check,
} from "lucide-react";

import {
  sendFriendRequest, removeFriend, cancelFriendRequest,
  acceptFriendRequest, rejectFriendRequest,
} from "@/app/actions/profile";

import ReportModal     from "@/components/admin/report-modal";
import EditProfileForm from "@/components/profile/EditProfileForm";
import FriendsList     from "@/components/profile/FriendsList";
import StreakCard      from "@/components/profile/StreakCard";
import TaskStatsCard   from "@/components/profile/TaskStatsCard";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { GoldCoin }   from "@/components/ui/gold-coin";
import { resolveAvatarSrc } from "@/src/lib/avatar";
// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats an ISO date string into DD/MM/YYYY. */
function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}



// ─── Small form-status buttons ────────────────────────────────────────────────

/** Submit button that reflects its parent <form>'s pending state. */
function AcceptButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className={`bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-white/20 ${pending ? "opacity-50 cursor-not-allowed" : "hover:bg-white/20"}`}>
      <Check size={14} />{pending ? "Accepting..." : "Accept"}
    </button>
  );
}

function RejectButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className={`bg-transparent border border-white/20 text-white/60 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pending ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 hover:text-white"}`}>
      <X size={14} />
    </button>
  );
}

// ─── Friend request action ────────────────────────────────────────────────────

/**
 * Renders the appropriate CTA based on the current friendship status
 * between the viewer and the profile being viewed.
 */
function FriendRequestAction({ profile, isOwnProfile }: { profile: any; isOwnProfile: boolean }) {
  const [isPending, startTransition] = useTransition();
  if (isOwnProfile) return null;

  const handleAction = (actionFn: (id: string) => Promise<any>, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    startTransition(async () => { await actionFn(profile.id); });
  };

  if (profile.friendStatus === "FRIENDS") return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
        <UserCheck size={18} /><span className="font-medium">Friends</span>
      </div>
      <button onClick={() => handleAction(removeFriend, "Are you sure you want to remove this friend?")} disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 font-medium transition-colors ${isPending ? "opacity-50" : "hover:bg-red-500/30"}`}>
        <UserMinus size={16} /><span className="text-sm">{isPending ? "Removing..." : "Remove"}</span>
      </button>
    </div>
  );

  if (profile.friendStatus === "REQUEST_SENT") return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/30">
        <Clock size={18} /><span className="font-medium">Request Pending</span>
      </div>
      <button onClick={() => handleAction(cancelFriendRequest)} disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 bg-white/10 text-white/60 rounded-lg border border-white/20 font-medium transition-colors ${isPending ? "opacity-50" : "hover:bg-white/20"}`}>
        <X size={16} /><span className="text-sm">{isPending ? "Canceling..." : "Cancel"}</span>
      </button>
    </div>
  );

  if (profile.friendStatus === "REQUEST_RECEIVED") return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
      <Clock size={18} /><span className="font-medium">Wants to be Friends</span>
    </div>
  );

  return (
    <button onClick={() => handleAction(sendFriendRequest)} disabled={isPending}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors ${isPending ? "opacity-50" : "hover:bg-blue-500"}`}>
      <UserPlus size={18} /><span>{isPending ? "Sending..." : "Add Friend"}</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ProfilePageClientProps {
  profile: any;
  isOwnProfile: boolean;
  rank?: number;
}

/**
 * Main client component for the Profile / Dashboard view.
 * Integrates gamification stats (XP, coins, level), user details,
 * friend management, and pending request handling.
 */
export default function ProfilePageClient({ profile, isOwnProfile, rank }: ProfilePageClientProps) {
  const [showFriends, setShowFriends] = useState(false);
  const [isEditing,   setIsEditing]   = useState(false);
  const [showReport,  setShowReport]  = useState(false);
  const [isPending,   startTransition] = useTransition();

  // ── XP / level math ──
  const level      = profile.progress?.level      ?? 1;
  const totalXp    = profile.progress?.experience ?? 0;   // field: progress.experience
  const coins      = profile.progress?.coins      ?? 0;
  const XP_PER_LEVEL = 100;
  const xpIntoLevel  = totalXp % XP_PER_LEVEL;
  const xpBarWidth   = Math.min((xpIntoLevel / XP_PER_LEVEL) * 100, 100);
  const xpToNext     = XP_PER_LEVEL - xpIntoLevel;

  const avatarSrc = resolveAvatarSrc(profile.pfp);

  const handleRemoveFriendFromList = (friendId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this friend?"))
      startTransition(async () => { await removeFriend(friendId); });
  };

  return (
    <LunarThemeWrapper>
    <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
      <div className="max-w-5xl w-full mx-auto py-8">

        {/* ── 1. HEADER & BIO ── */}
        <div className="bg-[#111629]/95 border border-white/10 rounded-2xl p-8 mb-8 flex flex-col md:flex-row gap-8 items-start shadow-2xl">

          {/* Avatar + level badge */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center text-4xl font-bold text-white/60 overflow-hidden border-4 border-white/10 shadow-md">
              {avatarSrc
                ? <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                : <span>{profile.fname?.[0] ?? profile.username?.[0] ?? ""}{profile.lname?.[0] ?? ""}</span>}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 rounded-xl rotate-12 border-4 border-[#111629] flex items-center justify-center shadow-lg">
              <span className="text-black font-black text-xl -rotate-12">{level}</span>
            </div>
          </div>

          {/* Name, username, XP bar, actions, bio */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white">{profile.fname || profile.username} {profile.lname}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-white/40 font-medium">@{profile.username}</p>
                  {isOwnProfile && (
                    <button onClick={() => setIsEditing(!isEditing)} title="Edit Profile"
                      className="p-1.5 bg-white/10 hover:bg-white/20 text-white/60 rounded-full transition-colors">
                      <Pencil size={14} />
                    </button>
                  )}
                </div>

                {/* XP progress bar */}
                <div className="mt-4 max-w-xs">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" /> Level {level}
                    </span>
                    <span className="text-xs font-bold text-white/60">{totalXp} XP total</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-yellow-400 transition-all duration-1000 ease-out" style={{ width: `${xpBarWidth}%` }} />
                  </div>
                  <p className="text-[9px] text-white/30 mt-1 font-medium">{xpToNext} XP until Level {level + 1}</p>
                </div>
              </div>

              {/* Friend + report actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <FriendRequestAction profile={profile} isOwnProfile={isOwnProfile} />
                {!isOwnProfile && (
                  <button onClick={() => setShowReport(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors">
                    <Flag size={16} /> Report User
                  </button>
                )}
              </div>
            </div>

            {showReport && (
              <ReportModal reportedUserId={profile.id} reportedUsername={profile.username} onClose={() => setShowReport(false)} />
            )}

            {/* Bio */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
                {isOwnProfile ? "About Me" : "About"}
              </h3>
              <p className="text-white/70 leading-relaxed">
                {profile.bio || (
                  <span className="text-white/30 italic">
                    {isOwnProfile ? "No bio written yet. Click the pencil icon to add one!" : "No bio yet."}
                  </span>
                )}
              </p>
            </div>

            {/* Edit profile modal — triggered by pencil icon above */}
            {isOwnProfile && isEditing && (
              <EditProfileForm profile={profile} onClose={() => setIsEditing(false)} />
            )}

            <div className="text-sm text-white/30 mt-2">Joined {formatDate(profile.createdAt)}</div>
          </div>
        </div>

        {/* ── 2. STATS (4-column grid) ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StreakCard streak={profile.stats?.streak ?? 0} rank={rank} />

          {/* Friends counter — click to toggle the friends list below */}
          <button onClick={() => setShowFriends(!showFriends)}
            className={`border rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center transition-colors ${showFriends ? "bg-orange-500/10 border-orange-500/30" : "bg-[#111629]/95 border-white/10 hover:bg-white/5"}`}>
            <div className="bg-orange-500/20 p-3 rounded-full mb-3 text-orange-400"><Users size={24} /></div>
            <span className="text-4xl font-bold text-white">{profile.stats?.friendCount ?? 0}</span>
            <span className="text-sm text-white/40 font-medium mt-1 flex items-center gap-1">
              Friends {showFriends ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          <TaskStatsCard stats={profile.stats} />
        </div>

        {/* ── 3. FRIENDS LIST (shown when counter is clicked) ── */}
        {showFriends && (
          <FriendsList friends={profile.friends} isOwnProfile={isOwnProfile}
            onClose={() => setShowFriends(false)} onRemoveFriend={handleRemoveFriendFromList} isPending={isPending} />
        )}

        {/* ── 4. XP / COINS CARD ── */}
        {(totalXp > 0 || level > 1) && (
          <div className="mb-8 bg-[#111629]/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-400/20 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border border-yellow-400/30">
                  <Star size={28} className="text-yellow-400 fill-yellow-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-yellow-400/70 uppercase tracking-widest">Total XP</p>
                  <p className="text-4xl font-black text-white">{totalXp.toLocaleString()}</p>
                </div>
                <div className="w-px h-14 bg-white/10 mx-2" />
                <div className="bg-amber-500/20 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border border-amber-500/30">
                  <GoldCoin size={32} />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-400/70 uppercase tracking-widest">Coins</p>
                  <p className="text-4xl font-black text-white">{coins.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Level</p>
                  <p className="text-3xl font-black text-yellow-400">{level}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Next Level</p>
                  <p className="text-lg font-bold text-white/50">{xpToNext} XP away</p>
                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden mt-1 border border-white/10">
                    <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000" style={{ width: `${xpBarWidth}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. PENDING FRIEND REQUESTS (own profile only) ── */}
        {isOwnProfile && profile.receivedRequests?.length > 0 && (
          <div className="mb-8 bg-[#111629]/95 border border-red-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/60" />
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
              Pending Friend Requests
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{profile.receivedRequests.length}</span>
            </h2>
            <div className="space-y-3">
              {profile.receivedRequests.map((req: any) => {
                const reqAvatarSrc = resolveAvatarSrc(req.sender.pfp);
                return (
                  <div key={req.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-full overflow-hidden">
                        {reqAvatarSrc
                          ? <img src={reqAvatarSrc} alt={req.sender.username} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-white/60 font-bold">{req.sender.fname?.[0] || req.sender.username[0]}</div>}
                      </div>
                      <div>
                        <p className="font-bold text-white">{req.sender.fname || req.sender.username} {req.sender.lname}</p>
                        <p className="text-xs text-white/40">@{req.sender.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <form action={acceptFriendRequest.bind(null, req.id)}><AcceptButton /></form>
                      <form action={rejectFriendRequest.bind(null, req.id)}><RejectButton /></form>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
    </LunarThemeWrapper>
  );
}
