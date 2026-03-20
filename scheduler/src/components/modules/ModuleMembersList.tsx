'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ChevronDown, ChevronUp, Crown, Shield, UserMinus } from "lucide-react";
import { updateMemberRole, removeMember } from "@/app/actions/module"; // <-- Added removeMember

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
  userId: string;
  user: MemberUser;
}

interface ModuleMembersListProps {
  members: Member[];
  isOwner: boolean;
  moduleId: string;
  currentUserRole: string; // <-- ADDED to check Admin vs Owner powers
}

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

export default function ModuleMembersList({ members, isOwner, moduleId, currentUserRole }: ModuleMembersListProps) {
  const router = useRouter();
  const [showMembers, setShowMembers] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (targetUserId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    setUpdatingId(targetUserId);
    const res = await updateMemberRole(moduleId, targetUserId, newRole);
    setUpdatingId(null);
    if (res.success) router.refresh();
    else alert(res.error);
  };

  const handleRemove = async (targetUserId: string) => {
    if (!confirm("Remove this member? This will delete all their module tasks and events.")) return;
    setUpdatingId(targetUserId);
    const res = await removeMember(moduleId, targetUserId);
    setUpdatingId(null);
    if (res.success) router.refresh();
    else alert(res.error);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
      <button
        onClick={() => setShowMembers((v) => !v)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors rounded-2xl"
      >
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users size={20} /> Members ({members.length})
        </h2>
        {showMembers ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>

      {showMembers && (
        <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {members.map((member) => {
              // Permission Logic
              const canManageRole = isOwner && member.role !== 'OWNER';
              const canRemove = (isOwner && member.role !== 'OWNER') || (currentUserRole === 'ADMIN' && member.role === 'MEMBER');

              return (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
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
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <RoleBadge role={member.role} />
                    
                    <div className="flex items-center gap-1">
                      {canManageRole && (
                        <button
                          onClick={() => handleRoleChange(member.user.id, member.role)}
                          disabled={updatingId === member.user.id}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors disabled:opacity-50 ${
                            member.role === 'ADMIN' ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {updatingId === member.user.id ? "..." : member.role === 'ADMIN' ? "Remove Admin" : "Make Admin"}
                        </button>
                      )}

                      {canRemove && (
                        <button
                          onClick={() => handleRemove(member.user.id)}
                          disabled={updatingId === member.user.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove Member"
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}