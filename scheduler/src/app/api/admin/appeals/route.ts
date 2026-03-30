/**
 * API route for fetching paginated appeals.
 *
 * Supports filtering by date range and status, sorting, and pagination.
 * Returns appeal data along with total count and page metadata.
 */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Builds a Prisma `where` filter object based on query parameters.
 *
 * @param {string | null} startDate - Start date for filtering (inclusive)
 * @param {string | null} endDate - End date for filtering (inclusive)
 * @param {string | null} status - Appeal status filter
 * @returns {Object} Prisma-compatible where clause
 */
function buildWhere(startDate: string | null, endDate: string | null, status: string | null) {
    const where: any = {};

    if (startDate || endDate) {
        where.createdAt = {};

        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status) {
        where.status = status;
    }

    return where;
}

/**
 * Generates pagination values for Prisma queries.
 *
 * @param {number} page - Current page number
 * @param {number} limit - Number of records per page
 * @returns {{ skip: number, take: number }} Pagination configuration
 */
function getPagination(page: number, limit: number) {
    return {
        skip: (page - 1) * limit,
        take: limit,
    };
}

/**
 * Handles GET requests for fetching paginated appeals.
 *
 * Supports:
 * - Pagination (page, limit)
 * - Sorting (sortBy, order)
 * - Filtering (date range, status)
 *
 * @param {Request} req - Incoming request object
 * @returns {Promise<NextResponse>} JSON response containing appeals and metadata
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const where = buildWhere(startDate, endDate, status);
    const { skip, take } = getPagination(page, limit);

    const [appeals, totalAppeals] = await Promise.all([
        prisma.appeal.findMany({
            where,
            skip,
            take,
            include: { user: true, report: true, handledBy: true },
            orderBy: { [sortBy]: order },
        }),
        prisma.appeal.count({ where }),
    ]);

    return NextResponse.json({
        appeals,
        totalAppeals,
        totalAppealPages: Math.ceil(totalAppeals / limit),
    });
}