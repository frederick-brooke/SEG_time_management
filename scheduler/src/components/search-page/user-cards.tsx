"use client";
import GlassCard from "@/components/ui/glassCard";

export default function UserCard({ user, onClick }) {
  return (
    <GlassCard onClick={onClick} className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:scale-[1.01] transition-transform duration-300">

      <div className="flex items-center gap-4">
        {/* profile image */}
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-sm font-semibold text-white overflow-hidden border border-white/10">
            {user.pfp ? (
              <img
                src={user.pfp}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {user.fname?.[0] ?? user.username?.[0] ?? ""}
                {user.lname?.[0] ?? ""}
              </span>
            )}
          </div>

          {/* user info */}
          <div className="flex flex-col">
            <span className="font-medium text-sm text-white">{user.username}</span>

            {user.fname && user.lname && (
              <span className="text-xs text-white/60">
                {user.fname} {user.lname}
              </span>
            )}
          </div>

          {/* optional action */}
          <button className="text-xs px-3 py-1 rounded-full bg-blue-400 text-white hover:bg-blue-500 transition">
            View
          </button>
      </div>     
    </GlassCard>
  );
}