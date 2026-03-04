<<<<<<< HEAD
'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  fname: string;
  lname: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        setProfile(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  if (status === "loading" || loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  if (!profile) {
    return <div className="p-8">No profile data found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-6">User Profile</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <p className="mt-1 text-lg">{profile.username}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-lg">{profile.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <p className="mt-1 text-lg">{profile.fname || <span className="text-gray-400 italic">Not set</span>}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <p className="mt-1 text-lg">{profile.lname || <span className="text-gray-400 italic">Not set</span>}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <p className="mt-1 text-lg">{new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
=======
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
>>>>>>> 0b9af23249e71e99d8ea84a5cdf6809686f978d1
}