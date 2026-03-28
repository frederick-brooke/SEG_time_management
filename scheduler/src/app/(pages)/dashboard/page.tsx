"use client";

/**
 * User dashboard page displaying exams, tasks, leaderboard, and wellbeing tools.
 * Handles authentication, data fetching, and core dashboard layout.
 */

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { getMyExams } from "@/app/actions/examActions";
import { UpcomingExams } from "@/components/dashboard/upcoming-exams";
import { useUI } from "@/context/UIContext";  
import { ProfileStats } from "@/components/profile/StatModules";
import { getMyProfile } from "@/app/actions/profile";
import { ComingUpSoon } from "@/components/coming-up-soon";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import LeaderboardClient from "../leaderboard/LeaderboardClient";
import { getFriendsLeaderboard } from "../../actions/leaderboard";
import { IconMoonStars } from "@tabler/icons-react";
import WellbeingPanel from "@/components/wellbeing/wellbeing_panel";
import { RocketProgress } from "@/components/ui/rocket-progress";
import { useTasks } from "@/hooks/useTasks";
import { CalendarEvents } from "@/components/calendar/CalendarEvents";

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

  // Task progress calculation
  const { tasks } = useTasks(session?.user?.id);
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === "completed").length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
              <h1 className="lunar-header text-4xl">
                Welcome, {profile?.fname || session?.user?.name || "User"}!
              </h1>

              {/* Progress bar */}
              <div className="w-full max-w-md mt-2">
                <RocketProgress progress={progressPercentage} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {!googleConnected && (
                  <button onClick={handleLinkGoogle} className="lunar-button-primary">
                    Connect Google Calendar
                  </button>
                )}

                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="bg-white/5 text-white/60 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md"
                >
                  Sign Out
                </button>
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
      {wellbeingVisible && (
        <div className="group fixed bottom-6 right-6 z-[900]">
          <button
            onClick={() => {
              setWellbeingOpen(true);
              setWellbeingVisible(false);
            }}
            className="relative flex h-16 w-16 items-center justify-center rounded-full ..."
            aria-label="Open wellbeing panel"
          >
            <IconMoonStars className="relative w-7 h-7" />
          </button>

          <span className="pointer-events-none absolute right-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 ...">
            Wellbeing
          </span>
        </div>
      )}
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