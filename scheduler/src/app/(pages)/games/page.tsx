import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getGameBalance } from "@/src/app/actions/games";
import GamesPageClient from "./GamesPageClient";

export default async function GamesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const balance = await getGameBalance();

  return <GamesPageClient initialBalance={balance} />;
}
