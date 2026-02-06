import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getMyProfile, updateProfile } from "@/src/app/actions/profile"; // <--- Import getMyProfile
import { AppSidebar } from "components/app-sidebar";
import { SidebarInset, SidebarProvider } from "components/ui/sidebar";
import { SiteHeader } from "components/site-header";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  // ✅ FIX: Use getMyProfile() which looks up by EMAIL (safer)
  const profile = await getMyProfile(); 

  // If still not found, it means the user is in the session but not in the DB
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
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="max-w-4xl w-full mx-auto py-8">
            
            {/* HEADER: Avatar & Name */}
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-600 overflow-hidden border-4 border-white shadow-md">
                {profile.pfp ? (
                  <img src={profile.pfp} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{profile.fname?.[0] ?? ""}{profile.lname?.[0] ?? ""}</span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{profile.fname} {profile.lname}</h1>
                <p className="text-gray-500">@{profile.username}</p>
                <div className="mt-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col items-center">
                <span className="text-4xl font-bold text-blue-600">{profile.stats.completedTasks}</span>
                <span className="text-sm text-gray-600 mt-1">Tasks Completed</span>
              </div>
              <div className="bg-green-50 p-6 rounded-xl border border-green-100 flex flex-col items-center">
                <span className="text-4xl font-bold text-green-600">{profile.stats.completionRate}%</span>
                <span className="text-sm text-gray-600 mt-1">Completion Rate</span>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 flex flex-col items-center">
                <span className="text-4xl font-bold text-purple-600">{profile.stats.totalTasks}</span>
                <span className="text-sm text-gray-600 mt-1">Total Tasks Created</span>
              </div>
            </div>

            {/* EDIT FORM */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
              
              <form action={updateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input 
                      name="fname" 
                      defaultValue={profile.fname || ""} 
                      className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-black focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input 
                      name="lname" 
                      defaultValue={profile.lname || ""} 
                      className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-black focus:outline-none" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea 
                    name="bio" 
                    defaultValue={profile.bio || ""} 
                    className="w-full border border-gray-300 p-2 rounded h-24 focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
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