import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";

/**
 * Builds a Prisma `where` clause for user queries.
 *
 * Supports:
 * - Username search (case-insensitive)
 * - Date range filtering (createdAt)
 * - Role/category filtering
 *
 * @param {string} search - Username search query
 * @param {string | null} startDate - Start date (inclusive)
 * @param {string | null} endDate - End date (inclusive)
 * @param {string | null} categories - Comma-separated role values
 * @returns {Prisma.UserWhereInput} Prisma-compatible where clause
 */
function buildUserWhere(search: string, startDate: string | null, endDate: string | null, categories: string | null): Prisma.UserWhereInput {
	const where: Prisma.UserWhereInput = {};

	if (search.trim()) {
		// Username search (case-insensitive partial match)
		where.username = { contains: search, mode: "insensitive" };
	}

	if (startDate || endDate) {
		const createdAt: Prisma.DateTimeFilter = {};

		if (startDate && !isNaN(Date.parse(startDate))) {
			createdAt.gte = new Date(startDate);
		}

		if (endDate && !isNaN(Date.parse(endDate))) {
			createdAt.lte = new Date(endDate);
		}

		if (Object.keys(createdAt).length) {
			where.createdAt = createdAt;
		}
	}

	// Role/category filtering
	if (categories?.trim()) {
		const roles = categories.split(",").map(c => c.trim().toUpperCase() as Role).filter(Boolean);

		if (roles.length) { where.role = { in: roles };}
	}

	return where;
}

/**
 * Generates pagination parameters for Prisma queries.
 *
 * @param {number} page - Current page number
 * @param {number} limit - Number of records per page
 * @returns {{ skip: number, take: number }} Pagination config
 */
function getPagination(page: number, limit: number) {
	return {
		skip: (page - 1) * limit,
		take: limit,
	};
}

/**
 * Ensures sorting is restricted to allowed fields.
 *
 * Prevents invalid queries or unsafe input usage.
 *
 * @param {string} sortBy - Requested sort field
 * @returns {string} Safe sort field
 */
function getSafeSort(sortBy: string) {
	const allowed = ["username", "createdAt", "role"];
	return allowed.includes(sortBy) ? sortBy : "createdAt";
}

/**
 * Fetches paginated users for admin dashboard.
 *
 * Features:
 * - Search by username
 * - Filtering (date range, roles)
 * - Sorting (safe fields only)
 * - Pagination
 * - Aggregated counts (reports, appeals)
 *
 * Access Control:
 * - Requires authenticated SUPERUSER session
 *
 * @param {Request} req - Incoming request
 * @returns {Promise<NextResponse>} Users data with metadata
 */
export async function GET(req: Request) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.json({ error: "No session found. Please log in." }, { status: 401 });
	}

	if (session.user?.role !== "SUPERUSER") {
		return NextResponse.json({ error: "Access denied. Superuser role required.", currentRole: session.user?.role }, { status: 403 });
	}

	const { searchParams } = new URL(req.url);

	const search = searchParams.get("search") || "";
	const sortBy = getSafeSort(searchParams.get("sortBy") || "createdAt");
	const order = searchParams.get("order") === "asc" ? "asc" : "desc";
	const page = parseInt(searchParams.get("page") || "1");
	const limit = parseInt(searchParams.get("limit") || "10");

	const startDate = searchParams.get("startDate");
	const endDate = searchParams.get("endDate");
	const categories = searchParams.get("categories");

	const where = buildUserWhere(search, startDate, endDate, categories);
	const { skip, take } = getPagination(page, limit);

	const [users, totalMatchingUsers] = await Promise.all([
		prisma.user.findMany({
			where,
			orderBy: [{ [sortBy]: order }, { id: "asc" }],
			skip,
			take,
			include: {_count: { select: { reportsMade: true, reportsReceived: true, appeals: true,},},},
		}),
		prisma.user.count({ where }),
	]);

	return NextResponse.json({users, totalUsers: totalMatchingUsers,totalUserPages: Math.ceil(totalMatchingUsers / limit),});
}