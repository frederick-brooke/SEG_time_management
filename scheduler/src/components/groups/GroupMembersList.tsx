'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ChevronDown, ChevronUp, Crown, UserMinus } from "lucide-react";
import { removeGroupMember } from "@/app/actions/groups";

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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
      <button onClick={() => setShowMembers((v) => !v)} className="w-full flex items-center justify-between p-6 text-left">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users size={20} /> Members ({members.length})
        </h2>
        {showMembers ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>
      {showMembers && (
        <div className="px-6 pb-6">
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {members.map((member: any) => {
              const canRemove = isOwner && member.role !== 'OWNER';

              return (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                  <Link href={`/profile/${member.user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden shrink-0">
                      {member.user.pfp ? <img src={member.user.pfp} alt={member.user.username} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">{member.user.fname?.[0] || member.user.username[0]}</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{member.user.fname || member.user.username} {member.user.lname}</p>
                      <p className="text-xs text-gray-500">@{member.user.username}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3 shrink-0">
                    {member.role === "OWNER" && (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 font-semibold">
                        <Crown size={12} /> Owner
                      </span>
                    )}
                    
                    {canRemove && (
                      <button onClick={() => handleRemove(member.user.id)} disabled={updatingId === member.user.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Remove Member">
                        <UserMinus size={16} />
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