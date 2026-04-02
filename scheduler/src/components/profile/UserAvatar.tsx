/**
 * @file UserAvatar.tsx
 * @description Renders a user's profile picture or a generated initial-based fallback avatar.
 * Handles missing image data by gracefully degrading to user initials.
 */
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
 * Extracts up to two initials based on the most complete name data available.
 *
 * @param {string} username - The user's handle.
 * @param {string | null} [fname] - The user's first name.
 * @param {string | null} [lname] - The user's last name.
 * @returns {string} The computed initials or a fallback character.
 */
function getInitials(username: string, fname?: string | null, lname?: string | null): string {
  if (fname && lname) return `${fname[0]}${lname[0]}`.toUpperCase();
  if (fname) return fname.slice(0, 2).toUpperCase();
  if (username) return username.slice(0, 2).toUpperCase();
  return "?";
}

/**
 * Renders a user's profile picture or a generated initial-based fallback avatar.
 *
 * @param {UserAvatarProps} props - Component props.
 * @returns {JSX.Element} The avatar UI element.
 */
export default function UserAvatar({ pfp, username, fname, lname, className = "" }: UserAvatarProps) {
  const avatarSrc = resolveAvatarSrc(pfp);
  const initials = getInitials(username, fname, lname);

  return (
    <div className={`relative flex items-center justify-center bg-blue-900 text-white rounded-full overflow-hidden ${className}`}>
      {avatarSrc ? (
        <img src={avatarSrc} alt={username} className="w-full h-full object-cover" />
      ) : initials !== "?" ? (
        <span className="font-bold tracking-widest">{initials}</span>
      ) : (
        <User size={24} className="text-white/50" />
      )}
    </div>
  );
}