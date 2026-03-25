import { User } from "lucide-react";
import { resolveAvatarSrc } from "@/lib/avatar";


/**
 * Props for the UserAvatar component.
 */
interface UserAvatarProps {
  pfp?: string | null;
  username: string;
  fname?: string | null;
  lname?: string | null;
  className?: string;
}

/**
 * Renders a user's profile picture or a generated initial-based fallback avatar.
 */
export default function UserAvatar({ pfp, username, fname, lname, className = "" }: UserAvatarProps) {
  const avatarSrc = resolveAvatarSrc(pfp);

  let initials = "?";
  
  // Extracts up to two initials based on the most complete name data available
  if (fname && lname) {
    initials = `${fname[0]}${lname[0]}`.toUpperCase();
  } else if (fname) {
    initials = fname.slice(0, 2).toUpperCase();
  } else if (username) {
    initials = username.slice(0, 2).toUpperCase();
  }

  return (
    <div className={`relative flex items-center justify-center bg-blue-900 text-white rounded-full overflow-hidden ${className}`}>
      {avatarSrc ? (
        <img src={avatarSrc} alt={username} className="w-full h-full object-cover" />
      ) : fname || username ? (
        <span className="font-bold tracking-widest">{initials}</span>
      ) : (
        <User size={24} className="text-white/50" />
      )}
    </div>
  );
}