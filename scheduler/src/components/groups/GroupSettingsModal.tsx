/**
 * @file GroupSettingsModal.tsx
 * @description A modal interface exclusively for Group Owners to update core group 
 * settings (name, description) and invite new friends to join the group.
 */
'use client';

import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { X, Settings, UserPlus } from "lucide-react";
import { updateGroupSettings, getMyFriendsForGroup, addGroupMember } from "@/app/actions/groups";

/**
 * Represents a user available to be added to the group.
 */
interface FriendData {
  id: string;
  username: string;
  fname?: string | null;
}

/**
 * Represents the core data of the group being edited.
 */
interface GroupData {
  id: string;
  name: string;
  description?: string | null;
  members: { userId: string }[];
}

/**
 * Props for the GroupSettingsModal component.
 */
interface GroupSettingsModalProps {
  group: GroupData;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Props for the internal SettingsForm component.
 */
interface SettingsFormProps {
  formData: { name: string; description: string };
  setFormData: (data: { name: string; description: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

/**
 * Props for the individual AddFriendRow component.
 */
interface AddFriendRowProps {
  friend: FriendData;
  isAdding: boolean;
  onAdd: (id: string) => void;
}

/**
 * Renders the form to update group details.
 *
 * @param {SettingsFormProps} props - Component props.
 * @returns {JSX.Element} The settings form.
 */
function SettingsForm({ formData, setFormData, onSubmit, isSubmitting }: SettingsFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 mb-8">
      <div>
        <label className="lunar-label">Group Name</label>
        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="lunar-input w-full p-3 mt-1" />
      </div>
      <div>
        <label className="lunar-label">Description</label>
        <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="lunar-input w-full p-3 mt-1 resize-none" />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full py-3 lunar-button-primary !text-white !bg-white/10 !border-white/20 hover:!bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50">
        {isSubmitting ? "Saving..." : "Save Details"}
      </Button>
    </form>
  );
}

/**
 * Renders an individual friend row with an add button.
 *
 * @param {AddFriendRowProps} props - Component props.
 * @returns {JSX.Element} The friend row.
 */
function AddFriendRow({ friend, isAdding, onAdd }: AddFriendRowProps) {
  const initial = friend.fname?.[0] || friend.username[0];
  
  return (
    <div className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 bg-[#0a0f1d] border border-white/20 text-white/60 rounded-full flex items-center justify-center font-black text-xs shrink-0">
          {initial}
        </div>
        <p className="text-sm font-bold text-white truncate">
          {friend.fname || friend.username}
        </p>
      </div>
      <Button 
        onClick={() => onAdd(friend.id)}
        disabled={isAdding}
        className="shrink-0 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
      >
        {isAdding ? "Adding..." : "Add"}
      </Button>
    </div>
  );
}

/**
 * Renders the list of available friends to add to the group.
 *
 * @param {{ availableFriends: FriendData[]; addingFriendId: string | null; onAdd: (id: string) => void }} props - Component props.
 * @returns {JSX.Element} The friends list section.
 */
function AddFriendsList({ availableFriends, addingFriendId, onAdd }: { availableFriends: FriendData[]; addingFriendId: string | null; onAdd: (id: string) => void }) {
  return (
    <div>
      <h3 className="lunar-label text-sm text-white mb-4 flex items-center gap-2">
        <UserPlus size={16} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> Add Friends to Group
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 lunar-scroll">
        {availableFriends.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-4 bg-white/5 rounded-xl border border-white/10 font-medium">
            All your friends are already in this group!
          </p>
        ) : (
          availableFriends.map((friend) => (
            <AddFriendRow key={friend.id} friend={friend} isAdding={addingFriendId === friend.id} onAdd={onAdd} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Modal specifically for the Group Owner to update basic group settings (name/description)
 * and to invite new friends to join the group.
 *
 * @param {GroupSettingsModalProps} props - Component props.
 * @returns {JSX.Element} The rendered settings modal.
 */
export default function GroupSettingsModal({ group, onClose, onSuccess }: GroupSettingsModalProps) {
  const [formData, setFormData] = useState({ name: group.name, description: group.description || "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

  useEffect(() => {
    getMyFriendsForGroup().then((data) => setFriends(data));
  }, []);

  const availableFriends = friends.filter(
    (friend) => !group.members.some((member) => member.userId === friend.id)
  );

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateGroupSettings(group.id, formData);
    setIsSubmitting(false);
    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert(result.error);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    setAddingFriendId(friendId);
    const result = await addGroupMember(group.id, friendId);
    setAddingFriendId(null);
    if (result.success) onSuccess();
    else alert(result.error);
  };

  return (
    <div className="lunar-overlay" onClick={onClose}>
      <div className="lunar-card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto lunar-scroll" onClick={(e) => e.stopPropagation()}>
        
        <header className="flex items-center justify-between mb-6">
          <h2 className="lunar-header flex items-center gap-2">
            <Settings size={18} className="text-white/40"/> Group Settings
          </h2>
          <Button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={24} />
          </Button>
        </header>

        <SettingsForm 
          formData={formData} 
          setFormData={setFormData} 
          onSubmit={handleUpdateDetails} 
          isSubmitting={isSubmitting} 
        />

        <hr className="border-t lunar-divider mb-6" />

        <AddFriendsList 
          availableFriends={availableFriends} 
          addingFriendId={addingFriendId} 
          onAdd={handleAddFriend} 
        />

      </div>
    </div>
  );
}