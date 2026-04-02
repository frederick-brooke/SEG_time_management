/**
 * @file GroupHeader.tsx
 * @description Renders the top-level header for a group view. Displays group metadata 
 * (title, description, member count) and provides role-based action controls for 
 * managing tasks, events, and group membership.
 */
'use client';

import { Button } from "@/components/ui/Button";
import { Users, ListTodo, Calendar, Trash, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { leaveGroup, deleteGroup } from "@/app/actions/groups";

/**
 * Represents the creator of a group.
 */
interface GroupCreator {
  username: string;
}

/**
 * Represents the core metadata of a group.
 */
interface GroupData {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  creator: GroupCreator;
}

/**
 * Props for the main GroupHeader component.
 */
interface GroupHeaderProps {
  group: GroupData;
  isOwner: boolean;
  onOpenTaskModal: () => void;
  onOpenEventModal: () => void;
  onOpenSettings: () => void;
}

/**
 * Props for the action controls sub-component.
 */
interface GroupActionControlsProps {
  isOwner: boolean;
  onOpenSettings: () => void;
  onOpenTaskModal: () => void;
  onOpenEventModal: () => void;
  onDelete: () => void;
  onLeave: () => void;
}

/**
 * Renders the group's title, description, and metadata block.
 *
 * @param {{ group: GroupData }} props - Component props.
 * @returns {JSX.Element} The group information display.
 */
function GroupInfoDisplay({ group }: { group: GroupData }) {
  return (
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
  );
}

/**
 * Renders role-based action buttons for group management and content creation.
 *
 * @param {GroupActionControlsProps} props - Component props.
 * @returns {JSX.Element} The cluster of action buttons.
 */
function GroupActionControls({ isOwner, onOpenSettings, onOpenTaskModal, onOpenEventModal, onDelete, onLeave }: GroupActionControlsProps) {
  const primaryButtonStyle = "lunar-button-primary flex items-center gap-2 !bg-white/10 !border-white/20 hover:!bg-white/20 !text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]";
  const dangerButtonStyle = "flex items-center gap-2 lunar-item-error px-4 py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-colors";

  return (
    <div className="flex gap-2 flex-wrap">
      {isOwner && (
        <Button onClick={onOpenSettings} className="lunar-button-ghost flex items-center gap-2" title="Group Settings">
          <Settings size={14} /> Settings
        </Button>
      )}
      <Button onClick={onOpenTaskModal} className={primaryButtonStyle}>
        <ListTodo size={14} /> Create Task
      </Button>
      <Button onClick={onOpenEventModal} className={primaryButtonStyle}>
        <Calendar size={14} /> Create Event
      </Button>
      
      {isOwner ? (
        <Button onClick={onDelete} className={dangerButtonStyle}>
          <Trash size={14} /> Delete Group
        </Button>
      ) : (
        <Button onClick={onLeave} className={dangerButtonStyle}>
          <LogOut size={14} /> Leave Group
        </Button>
      )}
    </div>
  );
}

/**
 * Renders the header section for a group, including title, description, and action buttons.
 *
 * @param {GroupHeaderProps} props - Component props.
 * @returns {JSX.Element} The rendered group header component.
 */
export default function GroupHeader({ group, isOwner, onOpenTaskModal, onOpenEventModal, onOpenSettings }: GroupHeaderProps) {
  const router = useRouter();

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    const result = await leaveGroup(group.id);
    if (result.success) router.push("/groups");
    else alert(result.error || "Failed to leave group");
  };

  const handleDeleteGroup = async () => {
    if (!confirm("Permanently delete this group? This cannot be undone.")) return;
    const result = await deleteGroup(group.id);
    if (result.success) router.push("/groups");
    else alert(result.error || "Failed to delete group");
  };

  return (
    <div className="lunar-card p-8 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <GroupInfoDisplay group={group} />
        <GroupActionControls 
          isOwner={isOwner} 
          onOpenSettings={onOpenSettings} 
          onOpenTaskModal={onOpenTaskModal} 
          onOpenEventModal={onOpenEventModal} 
          onDelete={handleDeleteGroup} 
          onLeave={handleLeave} 
        />
      </div>
    </div>
  );
}