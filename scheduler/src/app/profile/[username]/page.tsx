import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/src/app/actions/profile";
import { prisma } from "@/src/lib/prisma";
import ProfilePageClient from "../ProfilePageClient";

/**
 * Server component that fetches another user's profile by username
 * @param {Promise<{ username: string }>} params - URL parameters containing username
 * @return {JSX.Element} - Other user's profile page with friend request options
 */
export default async function UserProfilePage({ 
  params 
}: { 
  params: Promise<{ username: string }> 
}) {
  const { username } = await params;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  // If viewing own profile, redirect to /profile
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { username: true }
  });

  if (currentUser?.username === username) {
    redirect("/profile");
  }

  // Get the other user's profile
  const profile = await getProfile(username);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600">User not found</h1>
          <p className="mt-2 text-gray-600">No user exists with username: @{username}</p>
        </div>
      </div>
    );
  }

  return <ProfilePageClient profile={profile} isOwnProfile={false} />;
}