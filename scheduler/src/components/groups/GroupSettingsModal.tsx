'use client';

import { useState, useEffect } from "react";
import { X, Settings, UserPlus } from "lucide-react";
import { updateGroupSettings, getMyFriendsForGroup, addGroupMember } from "@/app/actions/groups";

interface GroupSettingsModalProps {
  group: any;
  onClose: () => void;
  onSuccess: () => void;
}

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings size={20} className="text-gray-500"/> Group Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Section 1: Details Form */}
        <form onSubmit={handleUpdateDetails} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none resize-none" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50">
            {isSubmitting ? "Saving..." : "Save Details"}
          </button>
        </form>

        <hr className="border-gray-200 mb-6" />

        {/* Section 2: Add Friends */}
        <div>
          <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-gray-500" /> Add Friends to Group
          </h3>
          
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {availableFriends.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-gray-100">
                All your friends are already in this group!
              </p>
            ) : (
              availableFriends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      {friend.fname?.[0] || friend.username[0]}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {friend.fname || friend.username}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleAddFriend(friend.id)}
                    disabled={addingFriendId === friend.id}
                    className="shrink-0 text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors disabled:opacity-50"
                  >
                    {addingFriendId === friend.id ? "Adding..." : "Add"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}