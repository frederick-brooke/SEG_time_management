import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

//fetches a list of users based on passed in filters at that point
export async function GET(req: Request) {
    // Debug: Check if cookies are being received
    const cookieStore = await cookies();

    cookieStore.get("__Secure-next-auth.session-token");

    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { error: "No session found. Please log in." },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(req.url);  //from the frontend URLSearchParams

    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    //by default it is given in descending order
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");      //forces a default of max 12 users on the page at all times
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categories = searchParams.get("categories");

    //dynamically build the query set
    const where: any = {
        AND: [{
            username:{
                not: session.user.username
            }}     
        ]
    };

    if (search && search.trim() !== "") {
        where.AND.push({
            username: {
                contains: search,
                mode: "insensitive"
            }
        });
    }

    //date filtering of theusers
    if (startDate || endDate) {
        const dateFilter: any = {};

        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }

        if (endDate) {
            dateFilter.lte = new Date(endDate);
        }

        where.AND.push({
            createdAt: dateFilter
        });
    }

    //category filtering
    if (categories) {
        const categoryArray = categories.split(",").map(c => c.trim().toUpperCase());
            
        where.AND.push({
            role: { in: categoryArray }
        });
    }

    //count number of users in one page and the total *matching* users in parallel
    //symbols -> Uppercase -> Lowercase ordering by default
    const [users, totalMatchingUsers] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { [sortBy]: order },
            skip: (page - 1) * limit,
            take: limit,
        }),

        prisma.user.count({ where })
    ]);

    return NextResponse.json({users, totalUsers: totalMatchingUsers, totalUserPages: Math.ceil(totalMatchingUsers/limit)});
}