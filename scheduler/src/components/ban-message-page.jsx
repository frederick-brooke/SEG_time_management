'use client';

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

export default function BannedPage() {
  const [banInfo, setBanInfo] = useState(null);     //get the API ban information for the user if any
  const [showAppeal, setShowAppeal] = useState(false);      //determine if the ban info or appeal gets rendered

  useEffect(() => {
    async function fetchBanInfo() {
        try {
        const res = await fetch("/api/ban-info", {
            credentials: "include",
        });

        if (!res.ok) {
            if (res.status === 401) {
            setBanInfo({
                reason: "You must be logged in",
                expires: null,
            });
            return; 
            }
            const text = await res.text();
            throw new Error(text || "Failed to fetch");
        }
        const data = await res.json();
        setBanInfo(data);
        } catch (err) {
        console.error(err);
        }
    }
    fetchBanInfo();
    }, []);

  if (!banInfo) return <p>Loading...</p>;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
        {!showAppeal && (
            <div>
                <h1 className="text-xl font-bold mb-4 text-red-600">
                    Account Banned
                </h1>

                <p><strong>Reason:</strong> {banInfo.reason}</p>
                <p><strong>Expires:</strong> {banInfo.expires ?? "Permanent"}</p>

                <button
                    onClick={() => setShowAppeal(true)}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
                >
                    Submit Appeal
                </button> 

                <button 
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
                >
                    Logout
                </button>       
            </div>
        )}

        {showAppeal && (
            <AppealModal
                onClose={() => setShowAppeal(false)}
                reportId={banInfo.reportId}
            />
        )}        
      </div>
    </div>
  );
}

function AppealModal({onClose, reportId}){
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);          //custom message displayed when loading

    async function handleSubmit() {
        try {
        setLoading(true);

        const res = await fetch("/api/appeal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description, reportId }),
            credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to submit appeal");

        onClose(); // close appeal modal
        } catch (err) {
        console.error(err);
        alert("Failed to submit appeal");
        } finally {
        setLoading(false);
        }
    }

    return(
        <div>
            <h2 className="text-lg font-semibold mb-4">Submit Appeal</h2>

            <textarea
                placeholder="Reasoning for the Appeal?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border p-2 rounded mb-4"
            />

            {/* Input for Image/screenshot proof later on add here */}

            <div className="flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border rounded"
                >
                    Cancel
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={!description || loading}
                    className="px-4 py-2 bg-red-500 text-white rounded"
                >
                    {loading ? "Submitting..." : "Submit Appeal"}
                </button>
            </div>
        </div>
    );
}