import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if(!session || session.user?.role !== "SUPERUSER"){
        return NextResponse.json(
            { error: "Access denied" },
            { status: 403 }
        );
    }

    const { searchParams } = new URL(req.url);  //from the frontend URLSearchParams

    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    //by default it is given in descending order
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const where: any = {};

    if (startDate || endDate) {
        where.createdAt = {};

        if (startDate) {
        where.createdAt.gte = new Date(startDate);
        }

        if (endDate) {
        where.createdAt.lte = new Date(endDate);
        }
    }

    if (status) {
        where.status = status.toUpperCase();
    }

    const totalMatchingReports = await prisma.report.count({
        where,
    });

    //pagination of the queries and combines adll searches
    const reports = await prisma.report.findMany({
        include: {
        reportedUser: {
            select: { id: true, username: true },
        },
        reportedBy: {
            select: { id: true, username: true },
        },
        handledBy: {
            select: { id: true, username: true },
        },
        },

        orderBy: {
            [sortBy]: order,
        },
        skip: (page - 1) * limit,
        take: limit,
    });

    return NextResponse.json({ 
        reports,
        totalPages: Math.ceil(totalMatchingReports / limit),
        totalMatchingReports, 
    });
}