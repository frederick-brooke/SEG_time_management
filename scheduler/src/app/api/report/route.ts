import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

/**
 * Creates a new user report.
 *
 * Requirements:
 * - User must be authenticated
 * - `reportedUserId` and `reason` are required
 *
 * Behavior:
 * - Associates the report with the reporting user
 * - Stores optional description for additional context
 *
 * @param {Request} req - Incoming request
 * @returns {Promise<NextResponse>} Created report or error response
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);	// Retrieve authenticated session

        if (!session || !session.user?.id){	// Ensure user is logged in
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();	// Parse request body
        const { reportedUserId, reason, description } = body;

        if(!reportedUserId || !reason) {	// Validate required fields
            return NextResponse.json(
                { error: "Missing mandatory fields!"},
                { status: 400 }
            );
        }
		
        const report = await prisma.report.create({		// Create report linked to reporting user
            data: {
                reportedUserId,
                reportedById: session.user.id,
                reason,
                description,
            },
        });

        return NextResponse.json({success: true, report});
    } catch (error) {
        return NextResponse.json(	// Handle unexpected server errors
            { error: "Failed to create report" },
            { status: 500 }
        );
    } 
}