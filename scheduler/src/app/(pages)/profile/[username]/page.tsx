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
