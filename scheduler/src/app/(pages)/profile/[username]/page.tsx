import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/app/actions/profile";
import { fetchUsernameByEmail } from "lib/profile-queries";
import ProfilePageClient from "../ProfilePageClient";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

/**
 * Server component that fetches another user's profile by username
 * @param {object} props - Component props.
 * @param {Promise<{ username: string }>} props.params - URL parameters containing username
 * @return {Promise<JSX.Element>} - Other user's profile page with friend request options
 */
export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  // If viewing own profile, redirect to /profile
  const currentUsername = await fetchUsernameByEmail(session.user.email);

  if (currentUsername === username) {
    redirect("/profile");
  }

  // Get the other user's profile
  const profile = await getProfile(username);

  if (!profile) {
    return (
      <LunarThemeWrapper>
        <div className="lunar-page flex items-center justify-center min-h-[60vh]">
          <div className="lunar-card p-8 text-center max-w-md w-full">
            <h1 className="lunar-header text-red-400 mb-2">User not found</h1>
            <p className="lunar-value">
              No user exists with username: <span className="text-white">@{username}</span>
            </p>
          </div>
        </div>
      </LunarThemeWrapper>
    );
  }

  return <ProfilePageClient profile={profile} isOwnProfile={false} />;
}