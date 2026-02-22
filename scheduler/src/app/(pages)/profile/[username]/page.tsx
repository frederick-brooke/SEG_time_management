<<<<<<< HEAD:scheduler/src/app/(pages)/profile/[username]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReportModal from "components/report-modal";

interface User {
  id: string;
  email: string;
  username: string;
  fname: string;
  lname: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { username } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!username) return;

    fetch(`/api/profile/${username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setUser(data.user);
      })
      .catch((err) => setError("Failed to load profile"));
  }, [username]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Loading...</p>;

  return (
    <div className="flex flex-col items-center justify-between mt-4">
        {/* Profile view */}
        <div className="flex-1 flex justify-center">
          <div className="max-w-md mx-auto p-4 border rounded shadow">
            <h1 className="text-2xl font-bold">{user.fname} {user.lname}</h1>
            <p className="text-gray-600">@{user.username}</p>
            <p>Email: {user.email}</p>
            <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Report button */}
        <button onClick={() => setShowReport(true)}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Report User
        </button>

        {showReport && (
          <ReportModal
            reportedUserId={user.id}
            onClose={() => setShowReport(false)}
          />
        )}
    </div>
  );
}
=======
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
>>>>>>> origin/feature/search-users:scheduler/src/app/profile/[username]/page.tsx
