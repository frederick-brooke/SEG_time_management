'use client';

import { Quote } from "lucide-react";

interface ProfileBioProps {
  bio?: string | null;
  isOwnProfile: boolean;
}

export default function ProfileBio({ bio, isOwnProfile }: ProfileBioProps) {
  return (
    <div className="relative h-full flex flex-col justify-center p-6 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5">
      <Quote className="absolute top-4 left-4 text-white/10" size={40} />
      <div className="relative z-10 pl-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
          {isOwnProfile ? "About Me" : "About"}
        </h3>
        <p className="text-white/80 leading-relaxed text-base md:text-lg font-medium">
          {bio ? (
            bio
          ) : (
            <span className="text-white/30 italic font-normal">
              {isOwnProfile ? "No bio written yet. Click 'Edit Profile' to add one!" : "No bio yet."}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}