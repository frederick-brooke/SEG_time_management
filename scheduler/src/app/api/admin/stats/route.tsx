import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Fetches aggregated admin statistics.
 *
 * Returns:
 * - Total number of users
 * - Total number of reports
 * - Total number of appeals
 *
 * Notes:
 * - Queries are executed in parallel for better performance
 * - Intended for admin dashboard usage
 *
 * @returns {Promise<NextResponse>} JSON response containing system statistics
 */
export async function GET() {
	try {
		// Execute count queries concurrently
		const [totalUsers, totalReports, totalAppeals] = await Promise.all([
		prisma.user.count(),
		prisma.report.count(),
		prisma.appeal.count()
		]);

		return NextResponse.json({
		totalUsers,
		totalReports,
		totalAppeals
		});

	} 
	catch (error) {
		console.error(error);	// Log error for debugging/monitoring

		return NextResponse.json(
		{ error: "Failed to fetch admin statistics" },
		{ status: 500 }
		);
	}
}