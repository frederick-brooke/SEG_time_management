/**
 * Leaderboard server page.
 * Authenticates the user, retrieves friends leaderboard data based on timeframe,
 * and renders the client-side leaderboard UI.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFriendsLeaderboard } from "@/app/actions/leaderboard";
import { Trophy } from "lucide-react";
import LeaderboardClient from "./LeaderboardClient";
import { Timeframe } from "@/types/leaderboard";
import { PageHeader } from "@/components/ui/page-header";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

export default async function LeaderboardPage(props: {
  searchParams: Promise<{ timeframe?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const { timeframe: rawTimeframe } = await props.searchParams;
  const timeframe = (rawTimeframe ?? "all") as Timeframe;

  const leaderboard = await getFriendsLeaderboard(timeframe).catch(() => []);

  return (
    <LunarThemeWrapper>
      <div className="lunar-page">
        <PageHeader
          icon={<Trophy size={26} className="text-yellow-400" />}
          title="Friends Leaderboard"
          subtitle="See how you stack up against your network."
        />

        <LeaderboardClient
          initialData={leaderboard ?? []}
          currentTimeframe={timeframe}
        />
      </div>
    </LunarThemeWrapper>
  );
}