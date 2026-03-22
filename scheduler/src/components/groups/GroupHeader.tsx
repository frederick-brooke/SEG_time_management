'use client';

import { Users, ListTodo, Calendar, Trash, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { leaveGroup, deleteGroup } from "@/app/actions/groups";

interface GroupHeaderProps {
  group: any;
  isOwner: boolean;
  onOpenTaskModal: () => void;
  onOpenEventModal: () => void;
  onOpenSettings: () => void;
}

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
    <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        
        {/* Title & Info */}
        <div className="flex items-start gap-4">
          <div className="bg-purple-50 p-4 rounded-xl shrink-0">
            <Users className="text-purple-600" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
            {group.description && <p className="text-gray-600 mt-2">{group.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Users size={16} /> {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
              </span>
              <span>Created by @{group.creator.username}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {isOwner && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 font-medium hover:bg-gray-100 transition-colors"
              title="Group Settings"
            >
              <Settings size={16} /> Settings
            </button>
          )}
          
          <button
            onClick={onOpenTaskModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-200 font-medium hover:bg-purple-100 transition-colors"
          >
            <ListTodo size={16} /> Create Task
          </button>
          
          <button
            onClick={onOpenEventModal}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg border border-green-200 font-medium hover:bg-green-100 transition-colors"
          >
            <Calendar size={16} /> Create Event
          </button>
          
          {isOwner ? (
            <button
              onClick={handleDeleteGroup}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium hover:bg-red-100 transition-colors"
            >
              <Trash size={16} /> Delete Group
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium hover:bg-red-100 transition-colors"
            >
              <LogOut size={16} /> Leave Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}