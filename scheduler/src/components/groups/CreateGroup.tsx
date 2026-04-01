/**
 * Modal interface for group creation and initial member selection.
 */
'use client';
import { Button } from "@/components/ui/Button";

import { useState, useEffect } from "react";
import { X, Users, Check } from "lucide-react";
import { createGroup, getMyFriendsForGroup } from "@/app/actions/groups";

interface Friend {
  id: string;
  username: string;
  fname: string | null;
  lname: string | null;
  pfp: string | null;
}

interface CreateGroupProps {
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal for creating a new group by selecting friends to add
 * @param {CreateGroupProps} props - Modal control callbacks
 * @return {JSX.Element} - Create group modal
 */
export default function CreateGroup({ onClose, onSuccess }: CreateGroupProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyFriendsForGroup().then((data) => {
      setFriends(data);
      setIsLoadingFriends(false);
    });
  }, []);

  /**
   * Toggles a friend's selection state in the member picker
   * @param {string} id - Friend user ID to toggle
   * @return {void}
   */
  const toggleFriend = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /**
   * Validates and submits the group creation form
   * @param {React.FormEvent} e - Form submit event
   * @return {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Group name is required");
    if (selectedIds.size === 0) return setError("Select at least one friend to add to the group");

    setIsSubmitting(true);
    const result = await createGroup(name, description || null, Array.from(selectedIds));
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to create group");
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="lunar-overlay z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="lunar-card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto lunar-scroll flex flex-col"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex items-start justify-between mb-6 shrink-0">
          <div>
            <h2 className="lunar-header text-2xl flex items-center gap-2 text-white">
              <Users size={20} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> 
              Create Group
            </h2>
            <p className="lunar-value text-xs mt-1">Add friends to start collaborating</p>
          </div>
          <Button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={24} />
          </Button>
        </div>

        {error && (
          <div className="lunar-item-error px-4 py-3 rounded-xl border text-sm font-medium mb-4 shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col min-h-0">
          <div className="shrink-0">
            <label className="lunar-label flex items-center gap-1">
              Group Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Study Squad, Project Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="lunar-input w-full p-3 mt-1"
            />
          </div>

          <div className="shrink-0">
            <label className="lunar-label flex items-center gap-1">
              Description <span className="text-white/30 lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              maxLength={300}
              placeholder="What is this group for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="lunar-input w-full p-3 mt-1 resize-none"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <label className="lunar-label flex items-center gap-1 shrink-0">
              Add Friends <span className="text-red-400">*</span>
              {selectedIds.size > 0 && (
                <span className="ml-auto text-[10px] text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
                  {selectedIds.size} selected
                </span>
              )}
            </label>

            {isLoadingFriends ? (
              <p className="text-xs text-white/40 py-4 text-center font-medium">Loading friends...</p>
            ) : friends.length === 0 ? (
              <p className="text-xs text-white/40 py-4 text-center font-medium">
                No friends yet — add friends from your profile first
              </p>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 border border-white/10 bg-white/5 rounded-xl p-2 mt-1 lunar-scroll">
                {friends.map((friend) => (
                  <FriendOption 
                    key={friend.id} 
                    friend={friend} 
                    isSelected={selectedIds.has(friend.id)} 
                    onToggle={() => toggleFriend(friend.id)} 
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2 shrink-0">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 lunar-button-ghost disabled:opacity-50 py-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingFriends}
              className="flex-1 lunar-button-primary !text-white !bg-white/10 !border-white/20 hover:!bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed py-3 text-xs"
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Sub-component for rendering individual friend selection rows.
 * @param {Object} props - The component properties
 * @param {Friend} props.friend - The friend data object
 * @param {boolean} props.isSelected - Whether the friend is currently selected
 * @param {Function} props.onToggle - Callback to toggle selection state
 * @return {JSX.Element} - The rendered row
 */
function FriendOption({ friend, isSelected, onToggle }: { friend: Friend, isSelected: boolean, onToggle: () => void }) {
  return (
    <Button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border ${
        isSelected 
          ? "bg-blue-500/20 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.1)]" 
          : "bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10"
      }`}
    >
      <div className="w-9 h-9 bg-[#0a0f1d] border border-white/20 rounded-full overflow-hidden shrink-0">
        {friend.pfp ? (
          <img src={friend.pfp} alt={friend.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60 font-black text-xs">
            {friend.fname?.[0] || friend.username[0]}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">
          {friend.fname || friend.username} {friend.lname}
        </p>
        <p className={`text-xs truncate ${isSelected ? "text-blue-300" : "text-white/40"}`}>
          @{friend.username}
        </p>
      </div>

      {isSelected && (
        <div className="shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)]">
          <Check size={12} className="text-white" />
        </div>
      )}
    </Button>
  );
}