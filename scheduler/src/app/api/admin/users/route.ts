// app/api/admin/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { error: "No session found. Please log in." },
            { status: 401 }
        );
    }

    //change back to the SUPERUSER once added in
    //needs local key inside the env file to work
    if (session.user?.role !== "SUPERUSER") {
        return NextResponse.json(
            { error: "Access denied. Superuser role required.", currentRole: session.user?.role },
            { status: 403 }
        );
    }

    const { searchParams } = new URL(req.url);  //from the frontend URLSearchParams

    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    //by default it is given in descending order
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categories = searchParams.get("categories");

    // restrict sortable fields (security)
    const allowedSortFields = ["username", "createdAt", "role"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    //dynamically build the query set
    const where: Prisma.UserWhereInput = { isDeleted: { not: true } };

    if (search.trim()) {
        where.username = {
            contains: search,
            mode: "insensitive",
        };
    }

    //date filtering of theusers
    if (startDate || endDate) {
        where.createdAt = {};

        if (startDate) {
            where.createdAt.gte = new Date(startDate);
        }

        if (endDate) {
            where.createdAt.lte = new Date(endDate);
        }
    }

    //category filtering
    if (categories) {
        const categoryArray = categories.split(",").map(c => c.trim().toUpperCase() as Role);
            
        where.role = { in: categoryArray };
    }

    // run queries in parallel
    const [users, totalMatchingUsers] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { [safeSortBy]: order },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                _count: {
                    select: {
                    reportsMade: true,
                    reportsReceived: true,
                    appeals: true
                    }
                }
            },
        }),
        prisma.user.count({ where })
    ]);

    return NextResponse.json({ users, totalUsers: totalMatchingUsers, totalUserPages: Math.ceil(totalMatchingUsers/limit)});
}