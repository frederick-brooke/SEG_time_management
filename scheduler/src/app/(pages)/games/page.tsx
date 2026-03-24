import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getGameBalance } from "@/app/actions/games";
import GamesPageClient from "./GamesPageClient";

/**
 * Server Component orchestrating the Games Hub.
 * Acts as a secure boundary: authenticates the user, fetches their current
 * game currency balance, and hydrates the interactive client view.
 *
 * @returns {Promise<JSX.Element>} The interactive games portal or a redirect to the login page.
 */
export default async function GamesPage() {
  // 1. Authenticate the Request
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  // 2. Fetch User State
  const balance = await getGameBalance();

  // 3. Render the Client Boundary
  // We use the nullish coalescing operator (?? 0) as a defensive safeguard.
  // If the database fails to return a valid balance, the UI won't crash receiving 'undefined'.
  return <GamesPageClient initialBalance={balance ?? 0} />;
}