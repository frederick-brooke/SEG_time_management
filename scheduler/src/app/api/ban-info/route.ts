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
	const session = await getServerSession(authOptions);
	
	// Ensure user is logged in
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Fetch user details (for ban status and expiration)
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
	});

	// Fetch most recent resolved report related to the user
	const report = await prisma.report.findFirst({
		where: {
			reportedUserId: session.user.id,
			status: "RESOLVED",
		},
		orderBy: { createdAt: "desc" },
	});

	return NextResponse.json({
		reason: report?.description ?? "Violation of community rules",
		expires: user?.banExpires,
		reportId: report?.id,
	});
}