'use client';
import { Button } from "@/components/ui/Button";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { AlertTriangle, ShieldOff, X } from "lucide-react";
import { LunarCard } from "@/components/ui/LunarCard";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { useSession } from "next-auth/react";
import AppealForm from "./AppealForm";
import BanInfo from "@/components/admin/banInfo";
import { useRouter } from "next/navigation";
/**
 * BannedPage
 * 
 * Main page displayed when a user is banned.
 * Handles:
 * - Fetching ban information from backend
 * - Verifying session state (auto-redirect if unbanned)
 * - Toggling between ban info view and appeal form
 * 
 * @returns {JSX.Element} Banned page UI
 */
export default function BannedPage() {
	const { banInfo, loading } = useBanInfo();
	const [showAppeal, setShowAppeal] = useState(false);

	if (loading) return <LoadingScreen />;

	return (
		<LunarThemeWrapper>
			<div className="min-h-screen flex items-center justify-center px-4">
				<LunarCard className="w-full max-w-md p-7 space-y-6 hover:-translate-y-0">
					{!showAppeal ? (
						<BanInfo banInfo={banInfo} onAppeal={() => setShowAppeal(true)} />
					) : (
						<AppealForm reportId={banInfo?.reportId} onClose={() => setShowAppeal(false)} />
					)}
				</LunarCard>
			</div>
		</LunarThemeWrapper>
	);
}

/**
*Custom hook that fetches ban information and validates user session.
*@returns {Object} The ban info state and loading status.
*@returns {Object|null} returns.BanInfo - The ban information object or null if not banned.
*@returns {boolean} returns.loading - Whether the ban info is currently loading.
*/
function useBanInfo() {
	const [banInfo, setBanInfo] = useState(null);
	const [loading, setLoading] = useState(true);
	const { update } = useSession();
	const router = useRouter();

	useEffect(() => {
		async function init() {
			await fetchBan(setBanInfo);
			await validateSession(update, router);
			setLoading(false);
		}
		init();
	}, []);

	return { banInfo, loading };
}

/**
*Fetches ban information from the API endpoint.
*@param {Function} setBanInfo - State setter function for ban information.
*@returns {Promise<void>}
*/
async function fetchBan(setBanInfo) {
	try {
		const res = await fetch("/api/ban-info", { credentials: "include" });

		if (!res.ok) {
			if (res.status === 401) {
				setBanInfo({ reason: "You must be logged in", expires: null });
				return;
			}
			throw new Error("Failed to fetch");
		}

		setBanInfo(await res.json());
	} catch (err) {
		console.error(err);
	}
}

/**
*Validates the current session and redirects to dashboard if user is not banned.
*@param {Function} update - NextAuth session update function.
*@returns {Promise<void>}
*/
async function validateSession(update, router) {
	const updatedSession = await update();
	if (!updatedSession?.user?.isBanned) {
		router.replace("/dashboard");
	}
}

/**
*Renders a centered loading screen with animated text.
*@returns {JSX.Element} The loading screen component.
*/
function LoadingScreen() {
	return (
		<LunarThemeWrapper>
			<div className="min-h-screen flex items-center justify-center">
				<p className="lunar-page-subtitle text-white/30 animate-pulse text-sm">
					Loading…
				</p>
			</div>
		</LunarThemeWrapper>
	);
}
