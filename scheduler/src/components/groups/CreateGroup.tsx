'use client';

import { useState, useEffect } from "react";
import { X, Users, Check } from "lucide-react";
import { createGroup, getMyFriendsForGroup } from "@/app/actions/groups";

//types 
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

// ─── Component ────────────────────────────────────────────────────────────────

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

  // Load friend list on mount
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

    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    if (selectedIds.size === 0) {
      setError("Select at least one friend to add to the group");
      return;
    }

    setIsSubmitting(true);
    const result = await createGroup(name, description || null, Array.from(selectedIds));
    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "Failed to create group");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Group</h2>
            <p className="text-xs text-gray-500 mt-1">Add friends to start collaborating</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Group name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Study Squad, Project Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent focus:outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              maxLength={300}
              placeholder="What is this group for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Friend picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Add Friends <span className="text-red-500">*</span>
              {selectedIds.size > 0 && (
                <span className="ml-2 text-xs font-normal text-purple-600">
                  {selectedIds.size} selected
                </span>
              )}
            </label>

            {isLoadingFriends ? (
              <p className="text-sm text-gray-400 py-4 text-center">Loading friends...</p>
            ) : friends.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No friends yet — add friends from your profile first
              </p>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                {friends.map((friend) => {
                  const selected = selectedIds.has(friend.id);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => toggleFriend(friend.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        selected ? "bg-purple-50 border border-purple-200" : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 bg-gray-300 rounded-full overflow-hidden shrink-0">
                        {friend.pfp ? (
                          <img src={friend.pfp} alt={friend.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-sm">
                            {friend.fname?.[0] || friend.username[0]}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {friend.fname || friend.username} {friend.lname}
                        </p>
                        <p className="text-xs text-gray-500">@{friend.username}</p>
                      </div>

                      {/* Tick */}
                      {selected && (
                        <div className="shrink-0 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingFriends}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
