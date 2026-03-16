import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getFriendsLeaderboard } from "@/src/app/actions/leaderboard";
import { Trophy } from "lucide-react";
import LeaderboardClient from "./LeaderboardClient";

// 1. Next.js 15+ requires searchParams to be typed as a Promise
export default async function LeaderboardPage(props: {
  searchParams: Promise<{ timeframe?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  // 2. Await the searchParams to "unwrap" them!
  const resolvedSearchParams = await props.searchParams;
  const timeframe = (resolvedSearchParams.timeframe || 'all') as 'day' | 'week' | 'month' | 'all';

  const leaderboard = await getFriendsLeaderboard(timeframe);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
      <div className="max-w-5xl w-full mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-yellow-100 p-4 rounded-full text-yellow-600">
            <Trophy size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Friends Leaderboard
            </h1>
            <p className="text-gray-500">
              See how you stack up against your network.
            </p>
          </div>
        </div>
        
        <LeaderboardClient initialData={leaderboard || []} currentTimeframe={timeframe} />
      </div>
    </div>
  );
}