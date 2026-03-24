'use client';

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { AlertTriangle } from "lucide-react";

export default function BannedPage() {
    const [banInfo, setBanInfo] = useState(null);     //get the API ban information for the user if any
    const [showAppeal, setShowAppeal] = useState(false);      //determine if the ban info or appeal gets rendered

    useEffect(() => {
        async function fetchBanInfo() {
            try {
            const res = await fetch("/api/ban-info", { credentials: "include", });

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

    if (!banInfo) {
        return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500">Loading...</p>
        </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl p-6 space-y-6">
                {!showAppeal && (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertTriangle className="text-red-600 w-5 h-5" />
                            </div>

                            <h1 className="text-lg font-semibold text-gray-800">
                                Account Banned
                            </h1>
                        </div>
                    
                        {/* Ban Details */}
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>
                                <span className="font-medium text-gray-800">Reason:</span>{" "}
                                {banInfo.reason}
                            </p>

                            {/* If temporary show the date that it will expire at */}
                            <p>
                                <span className="font-medium text-gray-800">Ban Expires:</span>{" "}
                                {banInfo.expires ? new Date(banInfo.expires).toLocaleString() : "Permanent"}
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={() => setShowAppeal(true)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
                            >
                                Submit Appeal
                            </button>

                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full border border-gray-300 hover:bg-gray-50 py-2 rounded-lg text-gray-700 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </>
                )}

                {showAppeal && (
                    <AppealModal
                        onClose={() => setShowAppeal(false)}
                        reportId={banInfo?.reportId}
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
            alert("Appeal submitted. Please wait while an admin reviews it.");
            onClose(); // close appeal modal
        } catch (err) {
            console.error(err);
            alert("Failed to submit appeal");
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className="space-y-4">

            <h2 className="text-lg font-semibold text-gray-800">
                Submit Appeal
            </h2>

            <p className="text-sm text-gray-500">
                Explain why you believe this ban was issued incorrectly.
            </p>

            <textarea
                placeholder="Provide details about your appeal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
            />

            <div className="flex justify-end gap-3 pt-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                    Cancel
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={!description || loading}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50"
                >
                    {loading ? "Submitting..." : "Submit Appeal"}
                </button>
            </div>
        </div>
    );
}