import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/src/app/actions/profile";
import { getFriendsLeaderboard } from "@/src/app/actions/leaderboard";
import ProfilePageClient from "./ProfilePageClient";

/**
 * Server component that fetches current user's profile data
 * @return {JSX.Element} - Own profile page with edit capabilities
 */
export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const profile = await getMyProfile(); 

  if (!profile) {
    return <div className="p-8">Profile not found. Please log in again.</div>;
  }

  // Fetch the leaderboard to determine the user's current rank
  const leaderboard = await getFriendsLeaderboard();
  let currentRank = 0;
  
  if (leaderboard) {
    // Find the user's index in the sorted leaderboard
    const index = leaderboard.findIndex(user => user.id === profile.id);
    // Rank is index + 1 (e.g., index 0 = rank 1). If not found, it remains 0.
    currentRank = index !== -1 ? index + 1 : 0;
  }

  return <ProfilePageClient profile={profile} isOwnProfile={true} rank={currentRank} />;
}