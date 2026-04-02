/**
 * @file ProfileBio.tsx
 * @description Renders the user's bio section on their profile page. Displays
 * the bio text if present, or a contextual empty-state prompt tailored to
 * whether the viewer is the profile owner.
 */

'use client';

import { Quote } from "lucide-react";

interface ProfileBioProps {
  bio?: string | null;
  isOwnProfile: boolean;
}

/**
 * Renders the empty-state bio message appropriate to the viewer.
 *
 * @param {{ isOwnProfile: boolean }} props - Component props.
 * @returns {JSX.Element} An italicised prompt or placeholder message.
 */
function EmptyBio({ isOwnProfile }: { isOwnProfile: boolean }) {
  const message = isOwnProfile
    ? "No bio written yet. Click 'Edit Profile' to add one!"
    : "No bio yet.";

  return (
    <span className="text-white/30 italic font-normal">{message}</span>
  );
}

/**
 * Renders the user's profile bio, or an empty-state message if no bio exists.
 *
 * @param {ProfileBioProps} props - Component props.
 * @returns {JSX.Element} The bio card.
 */
export default function ProfileBio({ bio, isOwnProfile }: ProfileBioProps) {
  const heading = isOwnProfile ? "About Me" : "About";

  return (
    <div className="relative h-full flex flex-col justify-center p-6 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5">
      <Quote className="absolute top-4 left-4 text-white/10" size={40} />
      <div className="relative z-10 pl-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
          {heading}
        </h3>
        <p className="text-white/80 leading-relaxed text-base md:text-lg font-medium">
          {bio ?? <EmptyBio isOwnProfile={isOwnProfile} />}
        </p>
      </div>
    </div>
  );
}