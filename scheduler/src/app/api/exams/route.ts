import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/exams
 * Fetches all exams for the authenticated user
 * Returns: { exams: Exam[] }
 */
export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const exams = await prisma.exam.findMany({
			where: { userId: session.user.id },
			include: {
				tasks: true,
				revisionMaterials: true,
			},
			orderBy: { examDate: "asc" },
		});

		return NextResponse.json({ exams });
	} catch (error) {
		console.error("Failed to fetch exams:", error);
		return NextResponse.json(
			{ error: "Failed to fetch exams" },
			{ status: 500 },
		);
	}
}
