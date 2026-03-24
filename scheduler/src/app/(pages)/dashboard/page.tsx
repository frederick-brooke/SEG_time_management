// scheduler/src/app/(pages)/dashboard/page.tsx
"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getMyExams } from "@/app/actions/examActions";
import { UpcomingExams } from "components/upcoming-exams";
import { useUI } from "@/context/UIContext";  //shared global states for controlling open/closing of modals/panels
import { ProfileStats } from "@/components/profile/StatModules";
import { getMyProfile } from "@/app/actions/profile";
import { ComingUpSoon } from "@/components/coming-up-soon";
import WellbeingPage from "../wellbeing/page";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

import { IconMoonStars } from "@tabler/icons-react";
import WellbeingPanel from "@/components/wellbeing/wellbeing_panel";
import { RocketProgress } from "@/components/ui/rocket-progress";
import { useTasks } from "@/hooks/useTasks";

export default function Page() {
  const { data: session, status }: {data: any; status: string } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");
  const {wellbeingOpen, setWellbeingOpen} = useUI();
  const [exams, setExams] = useState([]);
  const [profile, setProfile] = useState(null);

  const[wellbeingVisible, setWellbeingVisible] = useState(true);

  const { tasks } = useTasks(session?.user?.id);

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === "completed").length;

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  useEffect(() => {
    let isMounted = true; // Prevents fetching if the user moves away from screen
    async function loadData() {
      if (status === "authenticated" && !profile) {
        const [examData, profileData] = await Promise.all([
          getMyExams(),
          getMyProfile()
        ]);
        if (isMounted) {
          setExams(examData);
          setProfile(profileData);
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
   }, [status, router]);

   const googleConnected = profile?.accounts?.some(acc => acc.provider === 'google');

   const handleLinkGoogle = () => {
    router.push("/api/auth/signin/google");
   };

  return (
    <>
      <LunarThemeWrapper>
        <main className="max-w-7xl mx-auto pt-20 pb-12 lg:px-16 space-y-12 text-white/90">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            {/* Left Side: Greeting & Action Buttons */}
            <div className="flex-1 space-y-4">
              {/* Greeting bit */}
              <h1 className="lunar-header text-4xl">
                Welcome, {profile?.fname || session?.user?.name || 'User'}! 
              </h1>

              <div className="w-full max-w-md mt-2">
                <RocketProgress progress={progressPercentage} />
              </div>

              <div className="flex items-center gap-3">
                {!googleConnected &&  (
                  <button onClick={handleLinkGoogle} className="lunar-button-primary">
                    Connect Google Calendar
                  </button>
                )}
                <button onClick={() => signOut({ callbackUrl: "/login" })} className="bg-white/5 text-white/60 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md">
                  Sign Out
                </button>
              </div>
            </div>

            {/* Right Side: The Three Stats */}
            <div className="flex flex-col gap-3 shrink-0">
              <p className="lunar-label-subtitle">Your Progress</p>
              {profile && <ProfileStats profile={profile} />}
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Grid Layout for Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-12 items-start pt-12">
            <ComingUpSoon userId={session?.user?.id} exams={exams}/>

            <div className="hidden lg:block w-[3px] self-stretch bg-gradient-to-b from-transparent via-blue-500/40 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.2)] rounded-full opacity-50" />

            <UpcomingExams exams={exams} />
          </div>

          <WellbeingPanel open={wellbeingOpen} onClose={() => {setWellbeingOpen(false); setWellbeingVisible(true)}}/>
        </main>
      </LunarThemeWrapper>

      {/* Wellbeing Button */}
      {wellbeingVisible==true && (
        <div className="group fixed bottom-6 right-6 z-[900]">
          <button
            onClick={() => {setWellbeingOpen(true); setWellbeingVisible(false)}}
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-950 backdrop-blur-xl border border-white/10 text-red-300 shadow-[0_0_25px_rgba(168,85,247,0.45),0_0_60px_rgba(59,130,246,0.25)] hover:scale-110 hover:text-pink-300 hover:shadow-[0_0_35px_rgba(236,72,153,0.55),0_0_80px_rgba(168,85,247,0.35)] transition-all duration-300 animate-[pulse_4s_ease-in-out_infinite]"
            aria-label="Open wellbeing panel"
          >
            {/* glow ring */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-xl group-hover:opacity-40 transition" />

            {/* Pulse ring */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-20 animate-ping"></span>

            {/* icon */}
            <IconMoonStars className="relative w-7 h-7" />
          </button>

          {/* tooltip */}
          <span className="pointer-events-none absolute right-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 text-sm text-white bg-black/50 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 transition-all duration-300">
            Wellbeing
          </span>
        </div>
      )}
      
    </>
  )};
