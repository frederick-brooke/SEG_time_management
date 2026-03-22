'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ChevronDown, ChevronUp, Crown, UserMinus } from "lucide-react";
import { removeGroupMember } from "@/app/actions/groups";

//section component

/**
 * Displays a collapsible list of all members currently in the group.
 * Allows the group owner to remove standard members.
 *
 * @param {object} props - The component props.
 * @param {any[]} props.members - Array of member objects containing user details and roles.
 * @param {boolean} props.isOwner - True if the current user is the owner of the group.
 * @param {string} props.groupId - The unique identifier of the group.
 * @return {JSX.Element} The rendered list of group members.
 */
export default function GroupMembersList({ members, isOwner, groupId }: any) {
  const router = useRouter();
  const [showMembers, setShowMembers] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /**
   * Prompts for confirmation and executes the server action to remove a member.
   * @param {string} targetUserId - The ID of the user being removed.
   * @return {Promise<void>}
   */
  const handleRemove = async (targetUserId: string) => {
    if (!confirm("Remove this member? This will delete all their group tasks and events.")) return;
    setUpdatingId(targetUserId);
    const res = await removeGroupMember(groupId, targetUserId);
    setUpdatingId(null);
    if (res.success) router.refresh();
    else alert(res.error);
  };

  return (
    <div className="lunar-card mb-6">
      <button onClick={() => setShowMembers((v) => !v)} className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors rounded-[2rem]">
        <h2 className="lunar-label flex items-center gap-2 text-sm text-white">
          <Users size={16} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" /> Members ({members.length})
        </h2>
        {showMembers ? <ChevronUp size={18} className="text-white/50" /> : <ChevronDown size={18} className="text-white/50" />}
      </button>
      {showMembers && (
        <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 lunar-scroll">
            {members.map((member: any) => {
              const canRemove = isOwner && member.role !== 'OWNER';

              return (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <Link href={`/profile/${member.user.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-[#0a0f1d] border border-white/20 rounded-full overflow-hidden shrink-0">
                      {member.user.pfp ? <img src={member.user.pfp} alt={member.user.username} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/60 font-black text-sm">{member.user.fname?.[0] || member.user.username[0]}</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate text-sm">{member.user.fname || member.user.username} {member.user.lname}</p>
                      <p className="text-xs text-white/50 truncate">@{member.user.username}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3 shrink-0">
                    {member.role === "OWNER" && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 font-black uppercase tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                        <Crown size={10} /> Owner
                      </span>
                    )}
                    
                    {canRemove && (
                      <button onClick={() => handleRemove(member.user.id)} disabled={updatingId === member.user.id} className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50" title="Remove Member">
                        <UserMinus size={14} />
                      </button>
                    )}
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