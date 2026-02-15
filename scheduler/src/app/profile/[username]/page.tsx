import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getProfile, sendFriendRequest} from "@/src/app/actions/profile";
import { prisma } from "@/src/lib/prisma";
import { AppSidebar } from "components/app-sidebar";
import { SidebarInset, SidebarProvider } from "components/ui/sidebar";
import { SiteHeader } from "components/site-header";
import { Users, Trophy, Target, CheckCircle, UserPlus, UserCheck, Clock} from "lucide-react";

/**
 * displayes another user's public profile page
 * @param param0 usrl paramets containing username
 * @returns JSX.Element- user profile page with stats and friend request options
 */
export default async function UserProfilePage({ 
  params 
}: { 
  params: Promise<{ username: string }> 
}) {
  // Await params to get the username
  const { username } = await params;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  // If viewing own profile, redirect to /profile
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { username: true }
  });

  if (currentUser?.username === username) {
    redirect("/profile");
  }

  // Get the other user's profile
  const profile = await getProfile(username);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600">User not found</h1>
          <p className="mt-2 text-gray-600">No user exists with username: @{username}</p>
        </div>
      </div>
    );
  }
  /**
   * render the appropriate friend request button based on current friendship status
   * @return  {JSX.Element | null} - Friend request button or status badge
   */
  const FriendRequestButton = () => {
    if (profile.friendStatus == "FRIENDS"){
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
          <UserCheck size={18} />
          <span className="font-medium">Friends</span>
        </div>
      )
    }
    if (profile.friendStatus === "REQUEST_SENT") {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
          <Clock size={18} />
          <span className="font-medium">Request Pending</span>
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
    //show add friend button
    return (
      <form action={sendFriendRequest.bind(null, profile.id)}>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          <UserPlus size={18} />
          <span>Add Friend</span>
        </button>
      </form>
    );
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
            
            {/* Profile Header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm">
              <div className="flex gap-8 items-start">
                {/* Avatar */}
                <div className="w-32 h-32 shrink-0 bg-gray-100 rounded-full flex items-center justify-center text-4xl font-bold text-gray-500 overflow-hidden border-4 border-white shadow-md">
                  {profile.pfp ? (
                    <img src={profile.pfp} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{profile.fname?.[0] ?? ""}{profile.lname?.[0] ?? ""}</span>
                  )}
                </div>
                
                {/* Info  and Friend*/}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.fname} {profile.lname}
                  </h1>
                  <p className="text-gray-500 font-medium">@{profile.username}</p>
                  <FriendRequestButton />
                  {profile.bio && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</h3>
                      <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-400 mt-4">
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Friends Count */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="bg-orange-50 p-3 rounded-full mb-3 text-orange-600">
                  <Users size={24} />
                </div>
                <span className="text-4xl font-bold text-gray-900">{profile.stats.friendCount}</span>
                <span className="text-sm text-gray-500 font-medium mt-1">Friends</span>
              </div>

              {/* Task Stats */}
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

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}