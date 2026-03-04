import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getFriendsLeaderboard } from "@/src/app/actions/leaderboard";
import { AppSidebar } from "components/app-sidebar";
import { SidebarInset, SidebarProvider } from "components/ui/sidebar";
import { SiteHeader } from "components/site-header";
import { Trophy } from "lucide-react";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const leaderboard = await getFriendsLeaderboard();

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
            
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-yellow-100 p-4 rounded-full text-yellow-600">
                <Trophy size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Friends Leaderboard</h1>
                <p className="text-gray-500">See how you stack up against your network.</p>
              </div>
            </div>

            <LeaderboardClient initialData={leaderboard || []} />

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}