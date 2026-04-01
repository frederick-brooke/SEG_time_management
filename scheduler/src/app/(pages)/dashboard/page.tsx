"use client";
/**
 * User dashboard page displaying exams, tasks, leaderboard, and wellbeing tools.
 * Handles authentication, data fetching, and core dashboard layout.
 */
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useMemo } from "react";
import { getMyExams } from "@/app/actions/examActions";
import { UpcomingExams } from "@/components/dashboard/upcoming-exams";
import { useUI } from "@/context/UIContext";
import { useTaskProgress } from "@/context/TaskProgressContext";
import { ProfileStats } from "@/components/profile/StatModules";
import { getMyProfile } from "@/app/actions/profile";
import { ComingUpSoon } from "@/components/dashboard/coming-up-soon";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import LeaderboardClient from "../leaderboard/LeaderboardClient";
import { getFriendsLeaderboard } from "../../actions/leaderboard";
import { IconMoonStars } from "@tabler/icons-react";
import WellbeingPanel from "@/components/wellbeing/wellbeing_panel";
import { RocketProgress } from "@/components/ui/rocket-progress";
import { useTasks } from "@/hooks/useTasks";
import { CalendarEvents } from "@/components/calendar/CalendarEvents";

function DashboardContent() {
  const { data: session, status }: { data: any; status: string } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [errorMessage, setErrorMessage] = useState("");
  const { wellbeingOpen, setWellbeingOpen } = useUI();
  const [exams, setExams] = useState([]);
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [wellbeingVisible, setWellbeingVisible] = useState(true);

  const { progressPercentage, refreshProgress } = useTaskProgress();
  const userId = useMemo(() => session?.user?.id, [session?.user?.id]);

  useEffect(() => {
    if (userId && status === "authenticated") {
      refreshProgress(userId);
    }
  }, [userId, status, refreshProgress]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (status === "authenticated" && !profile) {
        const [examData, profileData, leaderboardData] = await Promise.all([
          getMyExams(),
          getMyProfile(),
          getFriendsLeaderboard("week"),
        ]);
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadExams() {
      if (session?.user?.id) {
        const data = await getMyExams();
        setExams(data);
      }
    }
    loadExams();
  }, [session]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "GoogleAccountTaken" || error === "OAuthAccountNotLinked") {
      setErrorMessage("This Google Account is already linked to another user.");
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const googleConnected = profile?.accounts?.some(
    (acc: any) => acc.provider === "google"
  );

  const handleLinkGoogle = () => {
    router.push("/api/auth/signin/google");
  };

  return (
    <>
      <LunarThemeWrapper>
        <main className="max-w-7xl mx-auto pt-16 pb-12 px-4 lg:px-16 space-y-12 text-white/90">

          {/* ── Header ── */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

            {/* Left: title + progress + buttons */}
            <div className="flex flex-col gap-5 flex-1">
              <h1 className="lunar-page-title text-4xl sm:text-5xl lg:text-6xl leading-tight">
                Welcome, {profile?.fname || session?.user?.name || "User"}!
              </h1>

              <div className="w-full max-w-lg">
                <RocketProgress progress={progressPercentage} />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
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

            {/* Right: stats — below title on mobile, beside on desktop */}
            {profile && (
              <div className="shrink-0 lg:pt-2">
                <ProfileStats profile={profile} />
              </div>
            )}
          </div>

          <hr className="border-white/5" />

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.4fr] gap-8 items-start">
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
