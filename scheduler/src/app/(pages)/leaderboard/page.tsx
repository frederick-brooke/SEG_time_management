import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFriendsLeaderboard } from "@/app/actions/leaderboard";
import { Trophy } from "lucide-react";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage(props: {
  searchParams: Promise<{ timeframe?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const resolvedSearchParams = await props.searchParams;
  const timeframe = (resolvedSearchParams.timeframe || 'all') as 'day' | 'week' | 'month' | 'all';
  const leaderboard = await getFriendsLeaderboard(timeframe);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl w-full mx-auto px-6 py-12 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Trophy size={26} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Friends Leaderboard
            </h1>
            <p className="text-sm text-white/45 mt-0.5">
              See how you stack up against your network.
            </p>
          </div>
        </div>

        <LeaderboardClient initialData={leaderboard || []} currentTimeframe={timeframe} />
      </div>
    </div>
  );
}