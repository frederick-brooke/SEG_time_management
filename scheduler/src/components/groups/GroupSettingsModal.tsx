'use client';

import { useState, useEffect } from "react";
import { X, Settings, UserPlus } from "lucide-react";
import { updateGroupSettings, getMyFriendsForGroup, addGroupMember } from "@/app/actions/groups";

//section types
interface GroupSettingsModalProps {
  group: any;
  onClose: () => void;
  onSuccess: () => void;
}

//section component

/**
 * Modal specifically for the Group Owner to update basic group settings (name/description)
 * and to invite new friends to join the group.
 *
 * @param {GroupSettingsModalProps} props - The component props.
 * @param {any} props.group - The current group data.
 * @param {() => void} props.onClose - Callback function to close the modal.
 * @param {() => void} props.onSuccess - Callback function triggered after a successful update/addition.
 * @return {JSX.Element} The rendered settings modal.
 */
export default function GroupSettingsModal({ group, onClose, onSuccess }: GroupSettingsModalProps) {
  const [formData, setFormData] = useState({ name: group.name, description: group.description || "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Friends state
  const [friends, setFriends] = useState<any[]>([]);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch friends when modal opens
    getMyFriendsForGroup().then((data) => setFriends(data));
  }, []);

  // Filter out friends who are already in the group
  const availableFriends = friends.filter(
    (friend) => !group.members.some((member: any) => member.userId === friend.id)
  );

  /**
   * Handles the form submission to update the group name and description.
   * @param {React.FormEvent} e - The form submission event.
   * @return {Promise<void>}
   */
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

  /**
   * Triggers the server action to instantly add a friend to the group.
   * @param {string} friendId - The user ID of the friend to add.
   * @return {Promise<void>}
   */
  const handleAddFriend = async (friendId: string) => {
    setAddingFriendId(friendId);
    const result = await addGroupMember(group.id, friendId);
    setAddingFriendId(null);
    if (result.success) onSuccess(); // Refresh page to show new member in background
    else alert(result.error);
  };

  return (
    <div className="lunar-overlay" onClick={onClose}>
      <div className="lunar-card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto lunar-scroll" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="lunar-header flex items-center gap-2">
            <Settings size={18} className="text-white/40"/> Group Settings
          </h2>
          <Button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={24} />
          </Button>
        </div>

        {/* Section 1: Details Form */}
        <form onSubmit={handleUpdateDetails} className="space-y-4 mb-8">
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

        <hr className="border-t lunar-divider mb-6" />

        {/* Section 2: Add Friends */}
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
                <div key={friend.id} className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-[#0a0f1d] border border-white/20 text-white/60 rounded-full flex items-center justify-center font-black text-xs shrink-0">
                      {friend.fname?.[0] || friend.username[0]}
                    </div>
                    <p className="text-sm font-bold text-white truncate">
                      {friend.fname || friend.username}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleAddFriend(friend.id)}
                    disabled={addingFriendId === friend.id}
                    className="shrink-0 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    {addingFriendId === friend.id ? "Adding..." : "Add"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}