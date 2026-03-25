import React from "react";

// types
export interface UserAvatarProps {
  pfp?: string | null;
  username: string;
  fname?: string | null;
  className?: string;
}

// components

/**
 * Displays a user's profile picture or a fallback initial.
 * Centralizes avatar logic to maintain DRY principles across the application.
 * * @param {UserAvatarProps} props - The user's avatar data and optional styling.
 * @return {JSX.Element} The rendered avatar circle.
 */
export default function UserAvatar({ pfp, username, fname, className = "w-10 h-10" }: UserAvatarProps) {
  const initial = fname?.[0] || username?.[0] || "?";

  return (
    <div className={`bg-white/10 rounded-full overflow-hidden flex-shrink-0 border border-white/10 ${className}`}>
      {pfp ? (
        <img 
          src={pfp} 
          alt={`${username}'s avatar`} 
          className="w-full h-full object-cover" 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/60 font-bold uppercase">
          {initial}
        </div>
      )}
    </div>
  );
}