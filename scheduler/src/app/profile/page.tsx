import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getMyProfile, updateProfile, acceptFriendRequest, rejectFriendRequest } from "@/src/app/actions/profile";
import { AppSidebar } from "components/app-sidebar";
import { SidebarInset, SidebarProvider } from "components/ui/sidebar";
import { SiteHeader } from "components/site-header";
import { Check, X, Users, Trophy, Target, CheckCircle } from "lucide-react";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const profile = await getMyProfile(); 

  if (!profile) return <div className="p-8">Profile not found. Please log in again.</div>;

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
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
                  <span>{profile.fname?.[0] ?? ""}{profile.lname?.[0] ?? ""}</span>
                )}
              </div>
              
              {/* Info & Bio */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profile.fname} {profile.lname}</h1>
                  <p className="text-gray-500 font-medium">@{profile.username}</p>
                </div>
                
                {/* THE DISPLAYED BIO */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About Me</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {profile.bio || <span className="text-gray-400 italic">No bio written yet. Use the form below to add one!</span>}
                  </p>
                </div>

                <div className="text-sm text-gray-400 flex items-center gap-2">
                   <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* 2. SPLIT STATS SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Left Column: Social Stats */}
              <div className="md:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="bg-orange-50 p-3 rounded-full mb-3 text-orange-600">
                  <Users size={24} />
                </div>
                <span className="text-4xl font-bold text-gray-900">{profile.stats.friendCount}</span>
                <span className="text-sm text-gray-500 font-medium mt-1">Friends</span>
              </div>

              {/* Right Column: Task Stats */}
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

            {/* 3. PENDING REQUESTS (Only shows if you have them) */}
            {profile.receivedRequests && profile.receivedRequests.length > 0 && (
              <div className="mb-8 bg-white border border-red-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                 <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                    Pending Friend Requests 
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{profile.receivedRequests.length}</span>
                 </h2>
                 <div className="space-y-3">
                    {profile.receivedRequests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                                     {req.sender.pfp ? (
                                        <img src={req.sender.pfp} alt={req.sender.username} className="w-full h-full object-cover" />
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                                            {req.sender.fname?.[0]}
                                        </div>
                                     )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{req.sender.fname} {req.sender.lname}</p>
                                    <p className="text-xs text-gray-500">@{req.sender.username}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <form action={acceptFriendRequest.bind(null, req.id)}>
                                    <button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                        <Check size={14} /> Accept
                                    </button>
                                </form>
                                <form action={rejectFriendRequest.bind(null, req.id)}>
                                    <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                                        <X size={14} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
            )}

            {/* 4. EDIT FORM (Collapsible or just at bottom) */}
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
                  <button 
                    type="submit" 
                    className="bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}