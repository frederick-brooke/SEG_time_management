'use client';

import { Users, ListTodo, Calendar, Trash, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { leaveGroup, deleteGroup } from "@/app/actions/groups";

//section types
interface GroupHeaderProps {
  group: any;
  isOwner: boolean;
  onOpenTaskModal: () => void;
  onOpenEventModal: () => void;
  onOpenSettings: () => void;
}

//section component

/**
 * Renders the header section for a group, including title, description, and action buttons.
 * Provides controls for the owner (Settings, Delete) and members (Leave), as well as task/event creation.
 *
 * @param {GroupHeaderProps} props - The component props.
 * @param {object} props.group - The group data object containing name, description, memberCount, etc.
 * @param {boolean} props.isOwner - True if the current user is the owner of the group.
 * @param {() => void} props.onOpenTaskModal - Callback function to open the task creation modal.
 * @param {() => void} props.onOpenEventModal - Callback function to open the event creation modal.
 * @param {() => void} props.onOpenSettings - Callback function to open the group settings modal.
 * @return {JSX.Element} The rendered group header component.
 */
export default function GroupHeader({ 
  group, 
  isOwner, 
  onOpenTaskModal, 
  onOpenEventModal, 
  onOpenSettings 
}: GroupHeaderProps) {
  const router = useRouter();

  /**
   * Prompts the user to confirm leaving the group, then executes the server action.
   * @return {Promise<void>}
   */
  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    const result = await leaveGroup(group.id);
    if (result.success) router.push("/groups");
    else alert(result.error || "Failed to leave group");
  };

  /**
   * Prompts the owner to confirm group deletion, then executes the server action.
   * @return {Promise<void>}
   */
  const handleDeleteGroup = async () => {
    if (!confirm("Permanently delete this group? This cannot be undone.")) return;
    const result = await deleteGroup(group.id);
    if (result.success) router.push("/groups");
    else alert(result.error || "Failed to delete group");
  };

  return (
    <div className="lunar-card p-8 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        
        {/* Title & Info */}
        <div className="flex items-start gap-4">
          <div className="bg-white/5 p-4 rounded-xl shrink-0 border border-white/10 shadow-inner">
            <Users className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={32} />
          </div>
          <div>
            <h1 className="lunar-page-title text-3xl">{group.name}</h1>
            {group.description && <p className="lunar-value mt-2">{group.description}</p>}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1 lunar-label !text-white">
                <Users size={14} className="text-white/50" /> {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
              </span>
              <span className="lunar-label !text-white">Created by @{group.creator.username}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {isOwner && (
            <button
              onClick={onOpenSettings}
              className="lunar-button-ghost flex items-center gap-2"
              title="Group Settings"
            >
              <Settings size={14} /> Settings
            </button>
          )}
          
          <button
            onClick={onOpenTaskModal}
            className="lunar-button-primary flex items-center gap-2 !bg-white/10 !border-white/20 hover:!bg-white/20 !text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <ListTodo size={14} /> Create Task
          </button>
          
          <button
            onClick={onOpenEventModal}
            className="lunar-button-primary flex items-center gap-2 !bg-white/10 !border-white/20 hover:!bg-white/20 !text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Calendar size={14} /> Create Event
          </button>
          
          {isOwner ? (
            <button
              onClick={handleDeleteGroup}
              className="flex items-center gap-2 lunar-item-error px-4 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-colors"
            >
              <Trash size={14} /> Delete Group
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="flex items-center gap-2 lunar-item-error px-4 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-colors"
            >
              <LogOut size={14} /> Leave Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}