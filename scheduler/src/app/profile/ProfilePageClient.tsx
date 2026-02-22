'use client';

import { updateProfile, acceptFriendRequest, rejectFriendRequest, sendFriendRequest, removeFriend, cancelFriendRequest } from "@/src/app/actions/profile";
import { AppSidebar } from "components/app-sidebar";
import { SidebarInset, SidebarProvider } from "components/ui/sidebar";
import { SiteHeader } from "components/site-header";
import { Check, X, Users, Trophy, Target, CheckCircle, UserPlus, UserCheck, Clock, ChevronDown, ChevronUp, UserMinus } from "lucide-react";
import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

/**
 * Formats a date string in UK format (DD/MM/YYYY) consistently for both server and client
 * @param {string} dateString - ISO date string to format
 * @return {string} - Formatted date in UK format (e.g., "12/02/2026")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

interface ProfilePageClientProps {
  profile: any;
  isOwnProfile: boolean;
}

/**
 * Submit button component with automatic loading state detection
 * @param {Object} props - Component props
 * @param {string} props.text - Button text to display
 * @param {string} props.loadingText - Text to show while submitting
 * @return {JSX.Element} - Button with loading state
 */
function SubmitButton({ text, loadingText }: { text: string; loadingText: string }) {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit"
      disabled={pending}
      className={`bg-black text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-gray-200 ${
        pending ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
      }`}>
      {pending ? loadingText : text}
    </button>
  );
}

/**
 * Accept friend request button with loading state
 * @param {string} requestId - The friend request ID to accept
 * @return {JSX.Element} - Accept button with loading indicator
 */
function AcceptButton({ requestId }: { requestId: string }) {
  const { pending } = useFormStatus();
  return (
    <button 
      disabled={pending}
      className={`bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
        pending ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
      }`}>
      <Check size={14} /> {pending ? "Accepting..." : "Accept"}
    </button>
  );
}

/**
 * Reject friend request button with loading state
 * @return {JSX.Element} - Reject button with loading indicator
 */
function RejectButton() {
  const { pending } = useFormStatus();
  
  return (
    <button 
      disabled={pending}
      className={`bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        pending ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
      }`}
    >
      <X size={14} />
    </button>
  );
}

/**
 * Shared client component for profile pages with interactive elements
 * @param {Object} profile - User profile data from server
 * @param {boolean} isOwnProfile - Whether this is the current user's own profile
 * @return {JSX.Element} - Interactive profile page layout
 */
export default function ProfilePageClient({ profile, isOwnProfile }: ProfilePageClientProps) {
  const [showFriends, setShowFriends] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * Renders the appropriate friend request button based on current friendship status
   * Only shown on other users' profiles, not your own
   * @return {JSX.Element | null} - Friend request button or status badge
   */
  const FriendRequestButton = () => {
    if (isOwnProfile) return null;

    /**
     * Handles sending a friend request with loading state
     * @return {Promise<void>} - Sends friend request via server action
     */
    const handleFriendRequest = async () => {
      startTransition(async () => {
        await sendFriendRequest(profile.id);
      });
    };
    /**
     * Handles removing a friend with loading state
     * @return {Promise<void>} - Removes friend via server action
     */
    const handleRemoveFriend = async () => {
      if (confirm('Are you sure you want to remove this friend?')) {
        startTransition(async () => {
          await removeFriend(profile.id);
        });
      }
    };

    /**
     * Handles canceling a pending friend request with loading state
     * @return {Promise<void>} - Cancels friend request via server action
     */
    const handleCancelRequest = async () => {
      startTransition(async () => {
        await cancelFriendRequest(profile.id);
      });
    };
    if (profile.friendStatus === "FRIENDS") {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <UserCheck size={18} />
            <span className="font-medium">Friends</span>
          </div>
          <button
            onClick={handleRemoveFriend}
            disabled={isPending}
            className={`flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium transition-colors ${
              isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-red-100"
            }`}>
            <UserMinus size={16} />
            <span className="text-sm">{isPending ? "Removing..." : "Remove"}</span>
          </button>
        </div>
      );
    }
    if (profile.friendStatus === "REQUEST_SENT") {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
            <Clock size={18} />
            <span className="font-medium">Request Pending</span>
          </div>
          <button
            onClick={handleCancelRequest}
            disabled={isPending}
            className={`flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-300 font-medium transition-colors ${
              isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"
            }`}
          >
            <X size={16} />
            <span className="text-sm">{isPending ? "Canceling..." : "Cancel"}</span>
          </button>
        </div>
      );
    }
    if (profile.friendStatus === "REQUEST_RECEIVED") {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
          <Clock size={18} />
          <span className="font-medium">Wants to be Friends</span>
        </div>
      );
    }

    // NONE - show add friend button
    return (
      <button 
        onClick={handleFriendRequest}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors ${
          isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
        }`}
      >
        <UserPlus size={18} />
        <span>{isPending ? "Sending..." : "Add Friend"}</span>
      </button>
    );
  };

  /**
   * Handles removing a friend from the friends list dropdown
   * @param {string} friendId - The database ID of the friend to remove
   * @param {React.MouseEvent} e - Click event to prevent navigation
   */
  const handleRemoveFriendFromList = async (friendId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to profile
    e.stopPropagation();
    
    if (confirm('Are you sure you want to remove this friend?')) {
      startTransition(async () => {
        await removeFriend(friendId);
      });
    }
  };
  return (
    <SidebarProvider
      defaultOpen={true}
      open={undefined}
      onOpenChange={undefined}
      className=""
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="">
        <SiteHeader />
        
        <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
          <div className="max-w-5xl w-full mx-auto py-8">
            
            {/* 1. HEADER & BIO SECTION */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 flex flex-col md:flex-row gap-8 items-start shadow-sm">
              {/* Avatar */}
              <div className="w-32 h-32 shrink-0 bg-gray-100 rounded-full flex items-center justify-center text-4xl font-bold text-gray-500 overflow-hidden border-4 border-white shadow-md">
                {profile.pfp ? (
                  <img src={profile.pfp} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{profile.fname?.[0] ?? profile.username?.[0] ?? ""}{profile.lname?.[0] ?? ""}</span>
                )}
              </div>
              
              {/* Info & Bio */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profile.fname || profile.username} {profile.lname}
                    </h1>
                    <p className="text-gray-500 font-medium">@{profile.username}</p>
                  </div>
                  
                  {/* Friend Request Button - Only on other profiles */}
                  <FriendRequestButton />
                </div>
                
                {/* THE DISPLAYED BIO */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {isOwnProfile ? "About Me" : "About"}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {profile.bio || (
                      <span className="text-gray-400 italic">
                        {isOwnProfile 
                          ? "No bio written yet. Use the form below to add one!" 
                          : "No bio yet."}
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-sm text-gray-400 flex items-center gap-2">  
                    <span>Joined {formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* 2. STATS SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              
              {/* NEW: Streak Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="bg-red-50 p-3 rounded-full mb-3">
                  <span className="text-3xl">🔥</span>
                </div>
                <span className="text-4xl font-bold text-gray-900">{profile.stats.streak || 0}</span>
                <span className="text-sm text-gray-500 font-medium mt-1">Day Streak</span>
              </div>

              {/* Friends - CLICKABLE */}
              <button
                onClick={() => setShowFriends(!showFriends)}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center hover:bg-gray-50 transition-colors"
              >
                <div className="bg-orange-50 p-3 rounded-full mb-3 text-orange-600">
                  <Users size={24} />
                </div>
                <span className="text-4xl font-bold text-gray-900">{profile.stats.friendCount}</span>
                <span className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-1">
                  Friends
                  {showFriends ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {/* Task Stats - NOW SPANS 2 COLUMNS */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="text-yellow-500" size={18} /> Task Performance
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  
                  <div className="bg-blue-50 p-4 rounded-xl flex flex-col items-center justify-center border border-blue-100">
                    <CheckCircle className="text-blue-500 mb-2" size={20} />
                    <span className="text-2xl font-bold text-blue-700">{profile.stats.completedTasks}</span>
                    <span className="text-xs text-blue-600 font-medium">Completed</span>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-xl flex flex-col items-center justify-center border border-purple-100">
                    <Target className="text-purple-500 mb-2" size={20} />
                    <span className="text-2xl font-bold text-purple-700">{profile.stats.totalTasks}</span>
                    <span className="text-xs text-purple-600 font-medium">Created</span>
                  </div>

                  <div className="bg-green-50 p-4 rounded-xl flex flex-col items-center justify-center border border-green-100">
                    <div className="text-green-500 mb-2 font-bold text-lg">%</div>
                    <span className="text-2xl font-bold text-green-700">{profile.stats.completionRate}%</span>
                    <span className="text-xs text-green-600 font-medium">Success Rate</span>
                  </div>

                </div>
              </div>
            </div>
            {/* FRIENDS LIST - Shows when toggled */}
            {showFriends && (
              <div className="mb-8 bg-white border border-orange-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
                  <Users size={20} className="text-orange-600" />
                  {isOwnProfile ? "My Friends" : "Friends"} ({profile.friends?.length || 0})
                </h2>
                
                {profile.friends && profile.friends.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {profile.friends.map((friend: any) => (
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
                        
                        {/* Remove Friend Button - Only show on own profile */}
                        {isOwnProfile && (
                          <button
                            onClick={(e) => handleRemoveFriendFromList(friend.id, e)}
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
            )}

            {/* 3. PENDING REQUESTS - Only on own profile */}
            {isOwnProfile && profile.receivedRequests && profile.receivedRequests.length > 0 && (
              <div className="mb-8 bg-white border border-red-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                 <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                    Pending Friend Requests 
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{profile.receivedRequests.length}</span>
                 </h2>
                 <div className="space-y-3">
                    {profile.receivedRequests.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                                     {req.sender.pfp ? (
                                        <img src={req.sender.pfp} alt={req.sender.username} className="w-full h-full object-cover" />
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                                            {req.sender.fname?.[0] || req.sender.username[0]}
                                        </div>
                                     )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{req.sender.fname || req.sender.username} {req.sender.lname}</p>
                                    <p className="text-xs text-gray-500">@{req.sender.username}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <form action={acceptFriendRequest.bind(null, req.id)}>
                                    <AcceptButton requestId={req.id} />
                                </form>
                                <form action={rejectFriendRequest.bind(null, req.id)}>
                                    <RejectButton />
                                </form>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
            )}

            {/* 4. EDIT FORM - Only on own profile */}
            {isOwnProfile && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-6 text-gray-900">Edit Profile Details</h2>
                
                <form action={updateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">First Name</label>
                      <input 
                        name="fname" 
                        defaultValue={profile.fname || ""} 
                        className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Last Name</label>
                      <input 
                        name="lname" 
                        defaultValue={profile.lname || ""} 
                        className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent focus:outline-none transition-all" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Bio</label>
                    <textarea 
                      name="bio" 
                      defaultValue={profile.bio || ""} 
                      className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg h-32 focus:ring-2 focus:ring-black focus:border-transparent focus:outline-none transition-all resize-none"
                      placeholder="Tell us a bit about yourself..."
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <SubmitButton text="Save Changes" loadingText="Saving..." />
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}



