"use client";
import GlassCard from "@/components/ui/glassCard";

export default function UserCard({ user, onClick }) {
  return (
    <GlassCard onClick={onClick} className="p-1.5 cursor-pointer hover:scale-[1.01] transition-transform duration-300">
      {/* profile image */}
      <div className="flex items-center gap-2 w-full">
        <div className="w-7 h-7 rounded-full bg-gray-800 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white overflow-hidden border border-white/10">
          {user.pfp ? (
            <img src={user.pfp} alt="Profile" className="w-full h-full object-cover"/>
          ) : (
            <span>
              {user.fname?.[0] ?? user.username?.[0] ?? ""}
              {user.lname?.[0] ?? ""}
            </span>
          )}
        </div>

        {/* user info */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-medium text-sm text-white truncate">{user.username}</span>

          {user.fname && user.lname && (
            <span className="text-xs text-white/60 truncate">
              {user.fname} {user.lname}
            </span>
          )}
        </div>

        {/* optional action */}
        <button className="ml-auto flex-shrink-0 text-xs px-3 py-0.5 rounded-full bg-blue-400 text-white hover:bg-blue-500 transition">
          View
        </button>
      </div>
    </GlassCard>
  );
}