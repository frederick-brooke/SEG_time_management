import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Builds a Prisma `where` filter object for report queries.
 *
 * Supports:
 * - Date range filtering (createdAt)
 * - Status filtering
 *
 * @param {string | null} startDate - Start date (inclusive)
 * @param {string | null} endDate - End date (inclusive)
 * @param {string | null} status - Report status
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
    where.status = status.toUpperCase();
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
 * Creates a new report entry in the database.
 *
 * @param {Object} data - Report payload
 * @param {string} data.reportedUserId - ID of the reported user
 * @param {string} data.reportedById - ID of the reporting user
 * @param {string} data.reason - Reason for the report
 * @param {string} data.description - Additional details
 * @returns {Promise<Object>} Created report record
 */
async function createReport(data: {
  reportedUserId: string;
  reportedById: string;
  reason: string;
  description: string;
}) {
  return prisma.report.create({ data });
}

/**
 * Fetches paginated reports for admin users.
 *
 * Features:
 * - Pagination (page, limit)
 * - Sorting (sortBy, order)
 * - Filtering (date range, status)
 *
 * Access Control:
 * - Restricted to SUPERUSER role
 *
 * @param {Request} req - Incoming request
 * @returns {Promise<NextResponse>} Reports data with metadata
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "SUPERUSER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const sortBy = searchParams.get("sortBy") || "createdAt";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const status = searchParams.get("status");

  const where = buildWhere(startDate, endDate, status);
  const { skip, take } = getPagination(page, limit);

  const [reports, totalMatchingReports, totalReports] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        reportedUser: {
          select: { id: true, username: true, isBanned: true, banExpires: true },
        },
        reportedBy: {
          select: { id: true, username: true },
        },
        handledBy: {
          select: { id: true, username: true },
        },
      },
      orderBy: { [sortBy]: order },
      skip,
      take,
    }),
    prisma.report.count({ where }),
    prisma.report.count(),
  ]);

  return NextResponse.json({
    reports,
    totalPages: Math.ceil(totalMatchingReports / limit),
    totalReports,
    totalMatchingReports,
  });
}

/**
 * Creates a new report submitted by a user.
 *
 * Validations:
 * - User must be authenticated
 * - User cannot report themselves
 * - Prevents duplicate reports for the same user
 *
 * @param {Request} req - Incoming request
 * @returns {Promise<NextResponse>} Created report or error response
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportedUserId, reason, description } = await req.json();

  if (reportedUserId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot report yourself." },
      { status: 400 }
    );
  }

  const existing = await prisma.report.findFirst({
    where: {
      reportedUserId,
      reportedById: session.user.id,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already reported this user." },
      { status: 409 }
    );
  }

  const report = await createReport({
    reportedUserId,
    reportedById: session.user.id,
    reason,
    description,
  });

  return NextResponse.json(report);
}