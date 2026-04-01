'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ChevronDown, ChevronUp, Crown, Shield, UserMinus } from "lucide-react";
import { updateMemberRole, removeMember } from "@/app/actions/module";

//section types
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
  currentUserRole: string;
}

//section subcomponents

/**
 * Badge showing the member's role — Owner or Admin only, nothing for regular members.
 * @param {{ role: string }} props - Member role string.
 * @return {JSX.Element | null} Role badge or null.
 */
function RoleBadge({ role }: { role: string }) {
  if (role === 'OWNER') {
    return (
      <span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 font-black uppercase tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.2)]">
        <Crown size={10} /> Owner
      </span>
    );
  }
  if (role === 'ADMIN') {
    return (
      <span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-white/10 text-white rounded-full border border-white/20 font-black uppercase tracking-wider shadow-[0_0_10px_rgba(255,255,255,0.1)]">
        <Shield size={10} /> Admin
      </span>
    );
  }
  return null;
}

//section main component

/**
 * Toggleable members list with role management and remove member controls for owners/admins.
 * @param {ModuleMembersListProps} props - Members data and permission flags.
 * @return {JSX.Element} Members list card.
 */
export default function ModuleMembersList({ members, isOwner, moduleId, currentUserRole }: ModuleMembersListProps) {
  const router = useRouter();
  const [showMembers, setShowMembers] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /**
   * Toggles a member's role between ADMIN and MEMBER.
   * @param {string} targetUserId - The user ID to update.
   * @param {string} currentRole - The member's current role.
   * @return {Promise<void>}
   */
  const handleRoleChange = async (targetUserId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    setUpdatingId(targetUserId);
    const res = await updateMemberRole(moduleId, targetUserId, newRole);
    setUpdatingId(null);
    if (res.success) router.refresh();
    else alert('error' in res ? res.error : 'Failed to update role');
  };

  /**
   * Confirms and removes a member from the module.
   * @param {string} targetUserId - The user ID to remove.
   * @return {Promise<void>}
   */
  const handleRemove = async (targetUserId: string) => {
    if (!confirm("Remove this member? This will delete all their module tasks and events.")) return;
    setUpdatingId(targetUserId);
    const res = await removeMember(moduleId, targetUserId);
    setUpdatingId(null);
    if (res.success) router.refresh();
    else alert('error' in res ? res.error : 'Failed to remove member');
  };

  return (
    <div className="lunar-card mb-6">
      <Button
        onClick={() => setShowMembers((v) => !v)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors rounded-[2rem]"
      >
        <h2 className="lunar-label flex items-center gap-2 text-sm text-white">
          <Users size={16} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" /> Members ({members.length})
        </h2>
        {showMembers
          ? <ChevronUp size={18} className="text-white/50" />
          : <ChevronDown size={18} className="text-white/50" />
        }
      </Button>

      {showMembers && (
        <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 lunar-scroll">
            {members.map((member) => {
              const canManageRole = isOwner && member.role !== 'OWNER';
              const canRemove = (isOwner && member.role !== 'OWNER') ||
                (currentUserRole === 'ADMIN' && member.role === 'MEMBER');

              return (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <Link href={`/profile/${member.user.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-white/10 rounded-full overflow-hidden shrink-0 border border-white/20">
                      {member.user.pfp ? (
                        <img src={member.user.pfp} alt={member.user.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/60 font-bold text-sm">
                          {member.user.fname?.[0] || member.user.username[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate text-sm">
                        {member.user.fname || member.user.username} {member.user.lname || ''}
                      </p>
                      <p className="text-xs text-white/50 truncate">@{member.user.username}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    <RoleBadge role={member.role} />
                    <div className="flex items-center gap-1">
                      {canManageRole && (
                        <Button
                          onClick={() => handleRoleChange(member.user.id, member.role)}
                          disabled={updatingId === member.user.id}
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ${
                            member.role === 'ADMIN'
                              ? "lunar-item-error border hover:bg-red-500/20"
                              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/20 hover:text-white"
                          }`}
                        >
                          {updatingId === member.user.id ? "..." : member.role === 'ADMIN' ? "Remove Admin" : "Make Admin"}
                        </Button>
                      )}
                      {canRemove && (
                        <Button
                          onClick={() => handleRemove(member.user.id)}
                          disabled={updatingId === member.user.id}
                          className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove Member"
                        >
                          <UserMinus size={14} />
                        </Button>
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