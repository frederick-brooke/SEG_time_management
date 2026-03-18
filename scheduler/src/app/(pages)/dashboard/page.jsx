"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Panel from "@/components/panel";
import WellbeingPage from "../wellbeing/page";
import { useSession, signIn, signOut } from "next-auth/react";

import { SiteHeader } from "@/src/components/site-header";
import { ComingUpSoon } from "@/src/components/coming-up-soon";
import { getMyExams } from "@/src/app/actions/examActions";
import { UpcomingExams } from "components/upcoming-exams";

import { useUI } from "@/context/UIContext";  //shared global states for controlling open/closing of modals/panels

import { ProfileStats } from "@/src/components/profile/StatModules";
import { getMyProfile } from "@/src/app/actions/profile";

import LunarThemeWrapper from "@/src/components/layout/LunarThemeWrapper";

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");
  const {wellbeingOpen, setWellbeingOpen} = useUI();
  const [exams, setExams] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadData() {
      const [examData, profileData] = await Promise.all([
        getMyExams(),
        getMyProfile()
      ]);
      setExams(examData);
      setProfile(profileData);
    }
    loadData();
  }, []);

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

  if (status === "loading") return <p className="p-4">Loading session...</p>;

  const googleConnected = !!session?.user?.googleConnected;

  const handleLinkGoogle = async () => {
    await signIn("google", {
      callbackUrl: "/dashboard",
      redirect: true,
    });
  };

  return (
    <LunarThemeWrapper>
      <main className="max-w-7xl mx-auto pt-20 pb-12 lg:px-16 space-y-12 text-white/90">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          
          {/* Left Side: Greeting & Action Buttons */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl font-semiblack tracking-light text-white">
                Welcome, {profile?.fname || session?.user?.name || 'User'}! 
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {!googleConnected &&  (
                <button onClick={handleLinkGoogle} className="bg-blue-500/10 text-blue-300 px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-widest hover:bg-blue-500/20 transition-all border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  Connect Google Calendar
                </button>
              )}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="bg-white/5 text-white/60 px-5 py-2.5 rounded0xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md">
                Sign Out
              </button>
            </div>
          </div>

          {/* Right Side: The Three Stats */}
          <div className="flex flex-col gap-3 shrink-0">
            <p className="text-[14px] font-bold text-white uppercase tracking-[0.4em]">Your Progress</p>
            {profile && <ProfileStats profile={profile} />}
          </div>
        </div>

        <hr className="border-white/5" />

        {/* -- Grid Layout for Cards -- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-12 items-start pt-12">
          <ComingUpSoon userId={session?.user?.id} exams={exams}/>

          <div className="hidden lg:block w-[3px] self-stretch bg-gradient-to-b from-transparent via-blue-500/40 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.2)] rounded-full opacity-50" />

          <UpcomingExams exams={exams} />
        </div>

        {/* Wellbeing Button */}
        <button
            onClick={() => setWellbeingOpen(true)}
            className="fixed bottom-6 right-6 z-[900] flex h-14 w-14 items-center justify-center rounded-full bg-pink-600 text-white shadow-lg hover:bg-pink-700 transition">
            ❤️
        </button>

        <Panel open={wellbeingOpen} onClose={() => setWellbeingOpen(false)} title="For Your Wellbeing">
            <WellbeingPage />
        </Panel> 
      </main>
    </LunarThemeWrapper>
  )};