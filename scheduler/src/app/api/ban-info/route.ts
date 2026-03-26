import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Fetches ban-related information for the authenticated user.
 *
 * Returns:
 * - The most recent resolved report (if any)
 * - Ban expiration date
 * - Report ID (for potential appeal use)
 *
 * Fallbacks:
 * - Provides a default reason if no report description is available
 *
 * Access Control:
 * - Requires authenticated user session
 *
 * @returns {Promise<NextResponse>} Ban details for the current user
 */
export async function GET() {
	const session = await getServerSession(authOptions);	// Retrieve authenticated session

	if (!session?.user?.id) {	// Ensure user is logged in
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const user = await prisma.user.findUnique({	// Fetch user details (for ban status and expiration)
		where: { id: session.user.id },
	});

	const report = await prisma.report.findFirst({  // Fetch most recent resolved report related to the user
		where: {
			reportedUserId: session.user.id,
			status: "RESOLVED",
		},
		orderBy: { createdAt: "desc" },
	});

	return NextResponse.json({
		reason: report?.description ?? "Violation of community rules",	    // Use report description if available, otherwise fallback message
		expires: user?.banExpires,	// Ban expiration (null for permanent bans or no ban)
		reportId: report?.id,		// Report ID for linking to appeals or further actions
	});
}