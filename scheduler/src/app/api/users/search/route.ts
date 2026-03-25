import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Builds a Prisma `where` clause for user search.
 *
 * Features:
 * - Excludes current user
 * - Username search (case-insensitive)
 * - Date range filtering
 * - Role/category filtering
 *
 * @param {string} search - Search query for usernames
 * @param {string} username - Current user's username (to exclude)
 * @param {string | null} startDate - Start date filter
 * @param {string | null} endDate - End date filter
 * @param {string | null} categories - Comma-separated roles
 * @returns {Object} Prisma-compatible where clause
 */
function buildUserSearchWhere(
  search: string,
  username: string,
  startDate: string | null,
  endDate: string | null,
  categories: string | null
) {
  const where: any = {
    AND: [
      {
        username: { not: username },
      },
    ],
  };

  if (search.trim()) {
    where.AND.push({
      username: {
        contains: search,
        mode: "insensitive",
      },
    });
  }

  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    where.AND.push({ createdAt: dateFilter });
  }

  if (categories) {
    const roles = categories
      .split(",")
      .map(c => c.trim().toUpperCase())
      .filter(Boolean);

    if (roles.length) {
      where.AND.push({ role: { in: roles } });
    }
  }

  return where;
}

/**
 * Generates pagination parameters for Prisma queries.
 *
 * @param {number} page - Current page number
 * @param {number} limit - Number of results per page
 * @returns {{ skip: number, take: number }} Pagination config
 */
function getPagination(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Searches users based on query parameters.
 *
 * Features:
 * - Requires authenticated session
 * - Username search (mandatory to trigger results)
 * - Filtering (date range, roles)
 * - Sorting and pagination
 * - Excludes current user from results
 *
 * Behavior:
 * - Returns empty result set if search query is empty
 *
 * @param {Request} req - Incoming request
 * @returns {Promise<NextResponse>} Paginated search results
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "No session found. Please log in." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";

  if (!search.trim()) {   // Do not return results if search is empty (prevents full table scan)
    return NextResponse.json({
      users: [],
      totalUsers: 0,
      totalUserPages: 0,
    });
  }

  const sortBy = searchParams.get("sortBy") || "createdAt";		// Extract query parameters
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const categories = searchParams.get("categories");

  const where = buildUserSearchWhere(		// Build filters and pagination config
    search,
    session.user.username,
    startDate,
    endDate,
    categories
  );

  const { skip, take } = getPagination(page, limit);

  const [users, totalMatchingUsers] = await Promise.all([ 		// Execute queries in parallel
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    totalUsers: totalMatchingUsers,
    totalUserPages: Math.ceil(totalMatchingUsers / limit),
  });
}