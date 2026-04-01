'use client';
import { Button } from "@/components/ui/Button";

/**
 * Client-side Profile page container.
 * Manages profile UI state (editing, friends list, transitions)
 * and composes all profile-related sections and stats cards.
 */

import { useState, useTransition } from "react";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { removeFriend } from "@/app/actions/profile";
import { calculateLevelProgress } from "@/app/actions/profile/xpUtils";
import EditProfileForm from "@/components/profile/EditProfileForm";
import FriendsList from "@/components/profile/FriendsList";
import PendingRequests from "@/components/profile/PendingRequests";
import StreakCard from "@/components/profile/StreakCard";
import TaskStatsCard from "@/components/profile/TaskStatsCard";
import PointsCard from "@/components/profile/PointsCard";
import FriendStatCard from "@/components/profile/FriendStatCard";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileBio from "@/components/profile/ProfileBio";

interface ProfilePageClientProps {
  profile: any;
  isOwnProfile: boolean;
  rank?: number;
}

/**
 * Main profile page client component.
 * Coordinates all profile sub-components and manages shared state.
 */
export default function ProfilePageClient({ profile, isOwnProfile, rank }: ProfilePageClientProps) {
  const [showFriends, setShowFriends] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalPoints = profile.progress?.experience ?? 0;
  const { level, xpBarWidth, xpToNext } = calculateLevelProgress(totalPoints);
  const coins      = profile.progress?.coins      ?? 0;


  const handleRemoveFriendFromList = (friendId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Remove this friend?")) {
      startTransition(async () => {
        await removeFriend(friendId);
      });
    }
  };

  return (
    <LunarThemeWrapper>
      <div className="lunar-page space-y-6">

        {/* Header + Bio Section */}
        <div className="lunar-card p-6 md:p-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">

            <div className="flex-1 md:max-w-[50%]">
              <ProfileHeader
                profile={profile}
                isOwnProfile={isOwnProfile}
                onEditToggle={() => setIsEditing(!isEditing)}
                level={level}
                xpBarWidth={xpBarWidth}
                xpToNext={xpToNext}
              />
            </div>

            <div className="flex-1 w-full border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
              {isOwnProfile && isEditing ? (
                <div className="animate-in fade-in duration-300 scale-95 origin-top">
                  <EditProfileForm profile={profile} onClose={() => setIsEditing(false)} />
                </div>
              ) : (
                <ProfileBio bio={profile.bio} isOwnProfile={isOwnProfile} />
              )}
            </div>

          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          <StreakCard streak={profile.stats?.streak ?? 0} rank={rank} />
          <FriendStatCard
            friendCount={profile.stats?.friendCount ?? 0}
            showFriends={showFriends}
            onToggle={() => setShowFriends(!showFriends)}
          />
          <TaskStatsCard stats={profile.stats} />
        </div>

        {/* Conditional Lists */}
        <div className="relative z-10 space-y-6">
          {showFriends && (
            <FriendsList
              friends={profile.friends}
              isOwnProfile={isOwnProfile}
              onClose={() => setShowFriends(false)}
              onRemoveFriend={handleRemoveFriendFromList}
              isPending={isPending}
            />
          )}

          {isOwnProfile && (profile.receivedRequests?.length ?? 0) > 0 && (
            <PendingRequests requests={profile.receivedRequests} />
          )}

          <PointsCard
            totalPoints={totalPoints}
            level={level}
            xpToNext={xpToNext}
            xpBarWidth={xpBarWidth}
            coins = {coins}
          />
        </div>

      </div>
    </LunarThemeWrapper>
        
  );
}

