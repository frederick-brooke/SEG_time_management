import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getFriendsLeaderboard } from "@/src/app/actions/leaderboard";
import { AppSidebar } from "components/app-sidebar";
import { SidebarInset, SidebarProvider } from "components/ui/sidebar";
import { SiteHeader } from "components/site-header";
import { Trophy, Medal, Flame } from "lucide-react";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const leaderboard = await getFriendsLeaderboard();

  return (
    <SidebarProvider
      defaultOpen={true}
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        
        <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
          <div className="max-w-4xl w-full mx-auto py-8">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-yellow-100 p-4 rounded-full text-yellow-600">
                <Trophy size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Friends Leaderboard</h1>
                <p className="text-gray-500">See how you stack up against your network.</p>
              </div>
            </div>

            {/* The Board */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-5">User</div>
                <div className="col-span-3 text-center">Current Streak</div>
                <div className="col-span-3 text-center">Tasks Done</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {!leaderboard || leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No friends to compete with yet! Head to a profile to add some.
                  </div>
                ) : (
                  leaderboard.map((user, index) => {
                    const rank = index + 1;
                    return (
                      <div 
                        key={user.id} 
                        className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-gray-50 ${
                          user.isCurrentUser ? "bg-blue-50/50 hover:bg-blue-50" : ""
                        }`}
                      >
                        {/* Rank */}
                        <div className="col-span-1 flex justify-center">
                          {rank === 1 ? <Medal className="text-yellow-500" size={24} /> :
                           rank === 2 ? <Medal className="text-gray-400" size={24} /> :
                           rank === 3 ? <Medal className="text-amber-700" size={24} /> :
                           <span className="font-bold text-gray-400 text-lg">{rank}</span>}
                        </div>

                        {/* User Info */}
                        <div className="col-span-5 flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shrink-0 border border-gray-200">
                            {user.pfp ? (
                              <img src={user.pfp} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-sm">
                                {user.name?.[0] || user.username[0]}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {user.name} {user.isCurrentUser && <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full ml-2">You</span>}
                            </p>
                            <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                          </div>
                        </div>

                        {/* Streak */}
                        <div className="col-span-3 flex justify-center items-center gap-1.5">
                          <Flame size={18} className={user.streak > 0 ? "text-red-500" : "text-gray-300"} />
                          <span className={`font-bold text-lg ${user.streak > 0 ? "text-gray-900" : "text-gray-400"}`}>
                            {user.streak}
                          </span>
                        </div>

                        {/* Tasks Completed */}
                        <div className="col-span-3 flex justify-center items-center">
                          <span className="font-bold text-gray-900 text-lg">{user.completedTasks}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}