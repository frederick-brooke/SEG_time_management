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

    //pagination of the queries and combines adll searches
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
            orderBy: {
                [sortBy]: order,
            },
            skip: (page - 1) * limit,
            take: limit,
        }),

        prisma.report.count({ where }), // filtered count

        prisma.report.count(), // total reports in database
    ]);

    return NextResponse.json({ 
        reports,
        totalPages: Math.ceil(totalMatchingReports / limit),
        totalReports, 
        totalMatchingReports
    });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
    const { reportedUserId, reason, description } = await req.json();
  
    // Prevent reporting yourself
    if (reportedUserId === session.user.id) {
      return NextResponse.json({ error: "You cannot report yourself." }, { status: 400 });
    }
  
    // Prevent duplicate reports
    const existing = await prisma.report.findFirst({
      where: {
        reportedUserId,
        reportedById: session.user.id,
      },
    });
  
    if (existing) {
      return NextResponse.json({ error: "You have already reported this user." }, { status: 409 });
    }
  
    const report = await prisma.report.create({
      data: {
        reportedUserId,
        reportedById: session.user.id,
        reason,
        description,
      },
    });
  
    return NextResponse.json(report);
  }