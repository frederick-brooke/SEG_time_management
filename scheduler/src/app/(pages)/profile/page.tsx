import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/app/actions/profile";
import ProfilePageClient from "./ProfilePageClient";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

/**
 * Server component that fetches the current user's profile data.
 * Redirects to login if unauthenticated.
 */
export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const profile = await getMyProfile();

  if (!profile) {
    return (
      <LunarThemeWrapper>
        <div className="lunar-page flex items-center justify-center min-h-[50vh]">
          <div className="lunar-card p-8 text-center max-w-md w-full">
            <h1 className="lunar-header text-red-400 mb-2">Profile Error</h1>
            <p className="lunar-value">Profile not found. Please log in again.</p>
          </div>
        </div>
      </LunarThemeWrapper>
    );
  }

  return <ProfilePageClient profile={profile} isOwnProfile={true} />;
}
