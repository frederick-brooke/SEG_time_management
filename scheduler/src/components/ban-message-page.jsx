'use client';

import { useEffect, useState } from "react";

export default function BannedPage() {
  const [banInfo, setBanInfo] = useState(null);

  useEffect(() => {
  fetch("/api/ban-info", { credentials: "include" })
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 401) {
          setBanInfo({ reason: "You must be logged in", expires: null });
          return;
        }
        const text = await res.text();
        throw new Error(text || "Failed to fetch");
      }
      return res.json();
    })
    .then(data => setBanInfo(data))
    .catch(console.error);
}, []);

  if (!banInfo) return <p>Loading...</p>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-full max-w-md">
        <h1 className="text-xl font-bold mb-4 text-red-600">
          Account Banned
        </h1>

        <p><strong>Reason:</strong> {banInfo.reason}</p>
        <p><strong>Expires:</strong> {banInfo.expires ?? "Permanent"}</p>

        <button
          onClick={() => fetch("/api/appeal", { method: "POST" })}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
        >
          Submit Appeal
        </button>
      </div>
    </div>
  );
}