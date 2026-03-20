'use client';

import { useState } from "react";
import Link from "next/link";
import { Users, ChevronDown, ChevronUp, Crown, Shield } from "lucide-react";

// Types
export interface MemberUser {
  id: string;
  username: string;
  fname: string | null;
  lname: string | null;
  pfp: string | null;
}

export interface Member {
  id: string;
  role: string;
  user: MemberUser;
}

interface ModuleMembersListProps {
  members: Member[];
}

/**
 * Displays a role badge for OWNER or ADMIN members
 */
function RoleBadge({ role }: { role: string }) {
  if (role === 'OWNER') {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 font-semibold">
        <Crown size={12} /> Owner
      </span>
    );
  }
  if (role === 'ADMIN') {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-semibold">
        <Shield size={12} /> Admin
      </span>
    );
  }
  return null;
}

export default function ModuleMembersList({ members }: ModuleMembersListProps) {
  const [showMembers, setShowMembers] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
      <button
        onClick={() => setShowMembers((v) => !v)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors rounded-2xl"
      >
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users size={20} /> Members ({members.length})
        </h2>
        {showMembers ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </button>

      {showMembers && (
        <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <Link href={`/profile/${member.user.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden shrink-0">
                    {member.user.pfp ? (
                      <img src={member.user.pfp} alt={member.user.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold bg-gray-200">
                        {member.user.fname?.[0] || member.user.username[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {member.user.fname || member.user.username} {member.user.lname || ''}
                    </p>
                    <p className="text-xs text-gray-500 truncate">@{member.user.username}</p>
                  </div>
                </Link>
                <RoleBadge role={member.role} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}