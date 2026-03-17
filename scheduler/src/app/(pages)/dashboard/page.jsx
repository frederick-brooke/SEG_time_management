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
    <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        
        {/* Left Side: Greeting & Action Buttons */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-light">
              Welcome, {profile?.fname || session?.user?.name || 'User'}! 
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {!googleConnected &&  (
              <button onClick={handleLinkGoogle} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition shadow-sm border border-blue-100">
                Connext Google Calendar
              </button>
            )}
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition border border-slate-200">
              Sign Out
            </button>
          </div>
        </div>

        {/* Right Side: The Three Stats */}
        <div className="flex flex-col gap-3 shrink-0">
          <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.4em] pr-2">Your Progress</p>
          {profile && <ProfileStats profile={profile} />}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* -- Grid Layout for Cards -- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <ComingUpSoon userId={session?.user?.id} />
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
  )};