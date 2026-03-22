'use client';

import { useState, useTransition } from "react";
import { 
  Users, UserPlus, UserCheck, Clock, 
  ChevronDown, ChevronUp, UserMinus, Flag, Star, Pencil, X
} from "lucide-react";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

//section actions
import { sendFriendRequest, removeFriend, cancelFriendRequest } from "../../actions/profile";

//section components
import ReportModal from "components/admin/report-modal";
import EditProfileForm from "components/profile/EditProfileForm";
import FriendsList from "components/profile/FriendsList";
import PendingRequests from "components/profile/PendingRequests";
import StreakCard from "components/profile/StreakCard";
import TaskStatsCard from "components/profile/TaskStatsCard";
import PointsCard from "components/profile/PointsCard";
import FriendStatCard from "components/profile/FriendStatCard";

//section types
interface ProfilePageClientProps {
  profile: any;
  isOwnProfile: boolean;
  rank?: number;
}

//section helpers

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats an ISO date string into DD/MM/YYYY. */
function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/** Resolves a pfp value to a usable src: handles "avatar:<key>" prefixes and raw URLs. */
function resolveAvatarSrc(pfp: string | null | undefined): string | null {
  if (!pfp) return null;
  if (pfp.startsWith("avatar:")) return AVATAR_IMAGES[pfp.slice("avatar:".length)] ?? null;
  return pfp;
}

// ─── Small form-status buttons ────────────────────────────────────────────────

/** Submit button that reflects its parent <form>'s pending state. */
function AcceptButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className={`bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${pending ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"}`}>
      <Check size={14} />{pending ? "Accepting..." : "Accept"}
    </button>
  );
}

function RejectButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className={`bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pending ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}>
      <X size={14} />
    </button>
  );
}

// ─── Friend request action ────────────────────────────────────────────────────

/**
 * Handles the logic and UI for sending, canceling, or removing friend requests.
 * @param {object} props - Component props.
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
        <div className="lunar-item-success flex items-center gap-2 px-4 py-2 rounded-lg border font-medium">
          <UserCheck size={18} />
          <span>Friends</span>
        </div>
        <button
          onClick={() => handleAction(removeFriend, 'Are you sure you want to remove this friend?')}
          disabled={isPending}
          className={`lunar-item-error flex items-center gap-2 px-3 py-2 rounded-lg border font-medium transition-colors ${isPending ? "opacity-50" : "hover:bg-red-500/20"}`}
        >
          <UserMinus size={16} />
          <span className="text-sm">{isPending ? "Removing..." : "Remove"}</span>
        </button>
      </div>
    );
  }

  if (profile.friendStatus === "REQUEST_SENT") {
    return (
      <div className="flex items-center gap-2">
        <div className="lunar-item-warning flex items-center gap-2 px-4 py-2 rounded-lg border font-medium">
          <Clock size={18} />
          <span>Request Pending</span>
        </div>
        <button
          onClick={() => handleAction(cancelFriendRequest)}
          disabled={isPending}
          className={`lunar-button-ghost flex items-center gap-2 ${isPending ? "opacity-50" : ""}`}
        >
          <X size={16} />
          <span>{isPending ? "Canceling..." : "Cancel"}</span>
        </button>
      </div>
    );
  }

  if (profile.friendStatus === "REQUEST_RECEIVED") {
    return (
      <div className="lunar-item-info flex items-center gap-2 px-4 py-2 rounded-lg border font-medium">
        <Clock size={18} />
        <span>Wants to be Friends</span>
      </div>
      <button onClick={() => handleAction(cancelFriendRequest)} disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-300 font-medium transition-colors ${isPending ? "opacity-50" : "hover:bg-gray-200"}`}>
        <X size={16} /><span className="text-sm">{isPending ? "Canceling..." : "Cancel"}</span>
      </button>
    </div>
  );

  if (profile.friendStatus === "REQUEST_RECEIVED") return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
      <Clock size={18} /><span className="font-medium">Wants to be Friends</span>
    </div>
  );

  return (
    <button
      onClick={() => handleAction(sendFriendRequest)}
      disabled={isPending}
      className={`lunar-button-primary flex items-center gap-2 ${isPending ? "opacity-50" : ""}`}
    >
      <UserPlus size={18} />
      <span>{isPending ? "Sending..." : "Add Friend"}</span>
    </button>
  );
}

//section component

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

  // Points / Level Math
  const level = profile.progress?.level ?? 1;
  const totalPoints = profile.progress?.points ?? 0;
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
      <div className="lunar-page">
        
        {/* ── 1. HEADER & BIO ── */}
        <div className="lunar-card p-8 flex flex-col md:flex-row gap-8 items-start relative z-10">
          
          {/* Avatar + Level Badge */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 bg-[#0a0f1d] rounded-full flex items-center justify-center text-4xl font-bold text-white/50 overflow-hidden border-4 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              {profile.pfp ? (
                <img src={profile.pfp} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{profile.fname?.[0] ?? profile.username?.[0] ?? ""}{profile.lname?.[0] ?? ""}</span>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-500 rounded-xl rotate-12 border-4 border-[#111629] flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <span className="text-white font-black text-xl -rotate-12">{level}</span>
            </div>
          </div>

          {/* Name, username, XP bar, actions, bio */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="lunar-page-title text-4xl">
                  {profile.fname || profile.username} {profile.lname}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <p className="lunar-value text-blue-400">@{profile.username}</p>
                  {isOwnProfile && (
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-1.5 lunar-button-ghost rounded-full"
                      title="Edit Profile"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>

                {/* XP Progress Bar */}
                <div className="mt-6 max-w-xs">
                  <div className="flex justify-between items-end mb-2">
                    <span className="lunar-label flex items-center gap-1">
                      <Star size={12} className="text-blue-400 fill-blue-400" />
                      Level {level}
                    </span>
                    <span className="lunar-label text-white/60">{totalPoints} XP total</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${xpBarWidth}%` }} />
                  </div>
                  <p className="text-[10px] text-white/40 mt-2 font-medium">{xpToNext} XP until Level {level + 1}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap mt-4 sm:mt-0">
                <FriendRequestAction profile={profile} isOwnProfile={isOwnProfile} />
                {!isOwnProfile && (
                  <button
                    onClick={() => setShowReport(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 font-bold tracking-wider text-[10px] uppercase rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    <Flag size={14} /> Report User
                  </button>
                )}
              </div>
            </div>

            {showReport && (
              <ReportModal reportedUserId={profile.id} reportedUsername={profile.username} onClose={() => setShowReport(false)} />
            )}

            {/* Bio Display */}
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm mt-4">
              <h3 className="lunar-label mb-2">
                {isOwnProfile ? "About Me" : "About"}
              </h3>
              <p className="text-white/70 leading-relaxed text-sm">
                {profile.bio ? profile.bio : (
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

            <div className="lunar-value text-xs mt-2">
              Joined {formatDate(profile.createdAt)}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          
          <StreakCard streak={profile.stats?.streak ?? 0} rank={rank} />

          <FriendStatCard 
            friendCount={profile.stats?.friendCount ?? 0} 
            showFriends={showFriends} 
            onToggle={() => setShowFriends(!showFriends)} 
          />

          <TaskStatsCard stats={profile.stats} />
          
        </div>

        {/* ── FRIENDS LIST ── */}
        <div className="relative z-10">
          {showFriends && (
            <FriendsList 
              friends={profile.friends} 
              isOwnProfile={isOwnProfile} 
              onClose={() => setShowFriends(false)} 
              onRemoveFriend={handleRemoveFriendFromList}
              isPending={isPending}
            />
          )}
        </div>
        {/* ── PENDING REQUESTS ── */}
        {isOwnProfile && (
          <div className="relative z-10">
            <PendingRequests requests={profile.receivedRequests} />
          </div>
        )}

        {/* ── POINTS CARD ── */}
        <div className="relative z-10">
          <PointsCard totalPoints={totalPoints} level={level} xpToNext={xpToNext} xpBarWidth={xpBarWidth} />
        </div>



      </div>
    </LunarThemeWrapper>
  );
}
