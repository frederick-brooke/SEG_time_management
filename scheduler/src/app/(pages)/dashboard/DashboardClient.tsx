"use client";

import { useState } from "react";
import { Pencil, X, Star, Zap, Trophy, Users } from "lucide-react";
import { updateProfile } from "../../actions/profile";
import { ComingUpSoon } from "@/src/components/coming-up-soon";
import { UpcomingExams } from "components/upcoming-exams";
import Panel from "@/components/panel";
import WellbeingPage from "../wellbeing/page";
import { useUI } from "@/context/UIContext";
import { signOut } from "next-auth/react";

// Reuse your existing sub-components (SubmitButton, etc.) here...

export default function DashboardClient({ profile, initialExams, session }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const { wellbeingOpen, setWellbeingOpen } = useUI();

  const level = profile.progress?.level ?? 1;
  const totalPoints = profile.progress?.points ?? 0;
  const xpBarWidth = Math.min(((totalPoints % 100) / 100) * 100, 100);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        
        {/* 1. PROFILE SECTION */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm relative">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            {isEditing ? <X size={20} /> : <Pencil size={20} />}
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar & Badge logic remains the same */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 bg-gray-100 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-4xl font-bold">
                {profile.pfp ? <img src={profile.pfp} alt="Profile" /> : <span>{profile.username?.[0]}</span>}
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 rounded-xl rotate-12 border-4 border-white flex items-center justify-center shadow-lg">
                <span className="text-black font-black text-xl -rotate-12">{level}</span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.fname || profile.username} {profile.lname}</h1>
                <p className="text-gray-500">@{profile.username}</p>
              </div>

              {/* Bio View / Edit Toggle */}
              {!isEditing ? (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About Me</h3>
                   <p className="text-gray-700">{profile.bio || "No bio yet."}</p>
                </div>
              ) : (
                <form action={updateProfile} className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <textarea 
                    name="bio" 
                    defaultValue={profile.bio} 
                    className="w-full border p-3 rounded-lg h-24 focus:ring-2 focus:ring-black outline-none"
                  />
                  <div className="flex justify-end">
                    <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg text-sm">Save Bio</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* 2. GAMIFIED STATS (Streak, Tasks, XP) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Insert your existing Stats cards (Streak, Task Performance, XP Bar) here */}
        </div>

        {/* 3. TASK CONTENT (The "Coming Up" integration) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="text-yellow-500" size={20} /> Action Items
            </h2>
            <ComingUpSoon userId={session?.user?.id} />
          </div>
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="text-blue-500" size={20} /> Upcoming Exams
            </h2>
            <UpcomingExams exams={initialExams} />
          </div>
        </div>
      </div>

      {/* 4. WELLBEING TOGGLE */}
      <button
        onClick={() => setWellbeingOpen(true)}
        className="fixed bottom-6 right-6 z-[50] flex h-14 w-14 items-center justify-center rounded-full bg-pink-600 text-white shadow-lg hover:bg-pink-700 transition-transform hover:scale-110"
      >
        ❤️
      </button>

      <Panel open={wellbeingOpen} onClose={() => setWellbeingOpen(false)} title="For Your Wellbeing">
        <WellbeingPage />
      </Panel>
    </div>
  );
}