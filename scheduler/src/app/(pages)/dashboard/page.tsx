"use client";

/**
 * User dashboard page displaying exams, tasks, leaderboard, and wellbeing tools.
 * Handles authentication, data fetching, and core dashboard layout.
 */

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useMemo } from "react";
import { getMyExams } from "@/app/actions/examActions";
import { UpcomingExams } from "@/components/dashboard/UpcomingExams";
import { useUI } from "@/context/UIContext";
import { useTaskProgress } from "@/context/TaskProgressContext";
import { ProfileStats } from "@/components/profile/StatModules";
import { getMyProfile } from "@/app/actions/profile";
import { ComingUpSoon } from "@/components/dashboard/ComingUpSoon";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper"
import LeaderboardClient from "../leaderboard/LeaderboardClient";
import { getFriendsLeaderboard } from "../../actions/leaderboard";
import { IconMoonStars } from "@tabler/icons-react";
import WellbeingPanel from "@/components/wellbeing/WellbeingPanel";
import { RocketProgress } from "@/components/ui/RocketProgress";
import { useTasks } from "@/hooks/useTasks";
import { CalendarEvents } from "@/components/calendar/CalendarEvents";
import { Button } from "@/components/ui/Button";

function DashboardContent() {
  // Session + auth state
  const { data: session, status }: { data: any; status: string } = useSession();

  const router = useRouter();
  const searchParams = useSearchParams();

  // Local UI state
  const [errorMessage, setErrorMessage] = useState("");
  const { wellbeingOpen, setWellbeingOpen } = useUI();
  const [exams, setExams] = useState([]);
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [wellbeingVisible, setWellbeingVisible] = useState(true);

  // Get progress from context (cached, persists across navigation)
  const { progressPercentage, refreshProgress } = useTaskProgress();

  // Extract userId from session first to prevent re-renders
  const userId = useMemo(() => session?.user?.id, [session?.user?.id]);

  // Refresh progress on mount and when userId changes
  useEffect(() => {
    if (userId && status === "authenticated") {
      refreshProgress(userId);
    }
  }, [userId, status, refreshProgress]);

  /**
   * Load core dashboard data once user is authenticated.
   * Uses Promise.all for parallel fetching.
   */
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (status === "authenticated" && !profile) {
        const [examData, profileData, leaderboardData] = await Promise.all([
          getMyExams(),
          getMyProfile(),
          getFriendsLeaderboard("week"),
        ]);

        // Prevent state update if component unmounted
        if (isMounted) {
          setExams(examData);
          setProfile(profileData);
          setLeaderboard(leaderboardData || []);
        }
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [status]);

  /**
   * Redirect unauthenticated users to login page
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  /**
   * Reload exams when session becomes available
   */
  useEffect(() => {
    async function loadExams() {
      if (session?.user?.id) {
        const data = await getMyExams();
        setExams(data);
      }
    }
    loadExams();
  }, [session]);

  /**
   * Handle OAuth-related errors from query params
   */
  useEffect(() => {
    const error = searchParams.get("error");

    if (error === "GoogleAccountTaken" || error === "OAuthAccountNotLinked") {
      setErrorMessage("This Google Account is already linked to another user.");
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  // Check if Google account is linked
  const googleConnected = profile?.accounts?.some(
    acc => acc.provider === "google"
  );

  const handleLinkGoogle = () => {
    router.push("/api/auth/signin/google");
  };

  return (
    <>
      <LunarThemeWrapper>
        <main className="max-w-7xl mx-auto pt-20 pb-12 lg:px-16 space-y-12 text-white/90">

          {/* Header section */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            <div className="flex-1 space-y-4">
              <h1 className="lunar-page-title">
                Welcome, {profile?.fname || session?.user?.name || "User"}!
              </h1>

              {/* Progress bar */}
              <div className="w-full max-w-md mt-2">
                <RocketProgress progress={progressPercentage} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {!googleConnected && (
                  <Button onClick={handleLinkGoogle} className="lunar-button-primary">
                    Connect Google Calendar
                  </Button>
                )}

                <Button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="bg-white/5 text-white/60 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md"
                >
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Profile stats */}
            <div className="flex flex-col gap-3 shrink-0">
              <p className="lunar-page-subtitle">Your Progress</p>
              {profile && <ProfileStats profile={profile} />}
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Main dashboard grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.4fr] gap-8 items-start pt-12">

            <div className="flex flex-col gap-8">
              <div className="lunar-glass p-6">
                <ComingUpSoon userId={session?.user?.id} exams={exams} />
              </div>
              <div className="lunar-glass p-6">
                <UpcomingExams exams={exams} />
              </div>
            </div>

            <div className="hidden lg:block w-[3px] self-stretch bg-gradient-to-b from-transparent via-blue-500/40 to-transparent rounded-full opacity-50" />

            <div className="flex flex-col gap-8">
              <LeaderboardClient initialData={leaderboard} currentTimeframe="week" />

              <div className="lunar-glass p-6">
                <CalendarEvents />
              </div>
            </div>
          </div>

          {/* Wellbeing modal */}
          <WellbeingPanel
            open={wellbeingOpen}
            onClose={() => {
              setWellbeingOpen(false);
              setWellbeingVisible(true);
            }}
          />
        </main>
      </LunarThemeWrapper>

		{/* Floating wellbeing button */}
		<div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-[900]">
    {wellbeingVisible && (
        <div className="group relative flex items-center">

            {/* Tooltip */}
            <span suppressHydrationWarning className="pointer-events-none absolute right-20 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-black/50 backdrop-blur-md px-3 py-1 text-sm text-white border border-white/10 opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                Wellbeing
            </span>

            {/* Button wrapper */}
            <div className="relative">
                {/* Pulse ring */}
                <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-20 animate-ping" />

                {/* Gradient glow layer */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-xl group-hover:opacity-40 transition" />

                {/* Button */}
                <Button
                    onClick={() => { setWellbeingOpen(true); setWellbeingVisible(false); }}
                    className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-950 backdrop-blur-xl border border-white/10 text-red-300 shadow-[0_0_25px_rgba(168,85,247,0.45),0_0_60px_rgba(59,130,246,0.25)] hover:scale-110 hover:text-pink-300 hover:shadow-[0_0_35px_rgba(236,72,153,0.55),0_0_80px_rgba(168,85,247,0.35)] transition-all duration-300 animate-[pulse_4s_ease-in-out_infinite]"
                    aria-label="Open wellbeing panel"
                >
                    <IconMoonStars className="relative w-7 h-7" />
                </Button>
            </div>

        </div>
    )}
</div>
    </>
  );
}

/**
 * Wrap dashboard in Suspense to handle async loading states
 */
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-white/50">Loading...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}