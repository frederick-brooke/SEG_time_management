/**
 * Games Hub server entry point.
 * Handles authentication, fetches the user's game balance, and passes data into the client-side Games Hub UI.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getGameBalance } from "@/app/actions/games";
import GamesPageClient from "./GamesPageClient";
import StarBackground from "@/components/StarBackground";

/**
 * Server Component orchestrating the Games Hub.
 * Acts as a secure boundary: authenticates the user, fetches their current
 * game currency balance, and hydrates the interactive client view.
 *
 * @returns {Promise<JSX.Element>} The interactive games portal or a redirect to the login page.
 */
export default async function GamesPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user?.email) {
		redirect("/login");
	}

	const balance = await getGameBalance();

	// If the database fails to return a valid balance, the UI won't crash receiving 'undefined'.
	return (
		<>
			<StarBackground />
			<GamesPageClient initialBalance={balance ?? 0} />
		</>
	);
}
