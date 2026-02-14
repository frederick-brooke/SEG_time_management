// app/api/admin/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    // Debug: Check if cookies are being received
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log("All cookies:", allCookies.map(c => c.name));

    const nextAuthCookie = cookieStore.get("next-auth.session-token") || 
    cookieStore.get("__Secure-next-auth.session-token");
    console.log("NextAuth cookie present:", !!nextAuthCookie);

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

    const totalUsers = await prisma.user.count(); //fixed number of users

    //dynamically build the query set
    const where: any = {};

    if (search && search.trim() !== "") {
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
        const categoryArray = categories
            .split(",")
            .map(c => c.trim().toUpperCase());
        where.role = {
            in: categoryArray,
        };
    }

    // total matching search
    const totalMatchingUsers = await prisma.user.count({
        where,
    });

    //filtered and sorted list of users
    console.log("Final where object:", JSON.stringify(where, null, 2));

    const users = await prisma.user.findMany({
        where,
        orderBy: {
            [sortBy]: order,
        },
        skip: (page - 1) * limit,
        take: limit,
    });

    const allRoles = await prisma.user.findMany({
        select: { role: true },
    });

    console.log("All roles in DB:", allRoles);



    return NextResponse.json({ totalUsers, users, totalPages: Math.ceil(totalMatchingUsers/limit), totalMatchingUsers});
}