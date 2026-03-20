'use client';

import Link from "next/link";
import { Users, X, UserMinus } from "lucide-react";

/**
 * Renders the user's friend list with options to view profiles or remove friends.
 * * @param {Object} props - Component props.
 * @param {Array} props.friends - Array of friend objects.
 * @param {boolean} props.isOwnProfile - True if the current user is viewing their own profile.
 * @param {Function} props.onClose - Function to close the friends list view.
 * @param {Function} props.onRemoveFriend - Function to handle the removal of a friend.
 * @param {boolean} props.isPending - Transition state for the remove action.
 * @return {JSX.Element} The friends list container.
 */
export default function FriendsList({ 
  friends, 
  isOwnProfile, 
  onClose, 
  onRemoveFriend, 
  isPending 
}: { 
  friends: any[]; 
  isOwnProfile: boolean; 
  onClose: () => void;
  onRemoveFriend: (id: string, e: React.MouseEvent) => void;
  isPending: boolean;
}) {
  return (
    <div className="mb-8 bg-white border border-orange-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users size={20} className="text-orange-600" />
          {isOwnProfile ? "My Friends" : "Friends"} ({friends?.length || 0})
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
          <X size={18} />
        </button>
      </div>

      {friends && friends.length > 0 ? (
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {friends.map((friend: any) => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Link
                href={`/profile/${friend.username}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
                  {friend.pfp ? (
                    <img src={friend.pfp} alt={friend.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-lg">
                      {friend.fname?.[0] || friend.username[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{friend.fname || friend.username} {friend.lname}</p>
                  <p className="text-sm text-gray-500 truncate">@{friend.username}</p>
                </div>
              </Link>

              {isOwnProfile && (
                <button
                  onClick={(e) => onRemoveFriend(friend.id, e)}
                  disabled={isPending}
                  className={`flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm font-medium transition-colors flex-shrink-0 ml-2 ${
                    isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-red-100"
                  }`}
                >
                  <UserMinus size={14} />
                  <span>Remove</span>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          {isOwnProfile ? "No friends yet. Start adding friends!" : "No friends to show."}
        </p>
      )}
    </div>
  );
}