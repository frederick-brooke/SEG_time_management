import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Creates a new appeal submitted by a user.
 *
 * Requirements:
 * - User must be authenticated
 * - `reportId` must be provided
 * - `description` must not be empty
 *
 * Behavior:
 * - Links the appeal to the authenticated user
 * - Associates the appeal with an existing report
 *
 * @param {Request} req - Incoming request
 * @returns {Promise<NextResponse>} Success or error response
 */
export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);	// Retrieve authenticated session
		// Ensure user is logged in
		if (!session?.user?.id) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 });}

		const body = await req.json();		// Parse request body
		const { description, reportId } = body;

		if (!reportId) {return new Response("Missing reportId", { status: 400 });}	// Validate required fields

		if (!description) {
			return NextResponse.json(
				{ error: "Description required" },
				{ status: 400 }
			);
		}

		await prisma.appeal.create({	// Create appeal linked to user and report
			data: {
				description,
				user: { connect: { id: session.user.id }},
				report: {connect: { id: reportId}}
			}
		})

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Appeal error:", error);	// Log error for debugging
		return NextResponse.json(
			{ error: "Server error" },
			{ status: 500 }
		);
	}
}