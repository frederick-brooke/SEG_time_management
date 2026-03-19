import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: any = {};

    // date filtering
    if (startDate || endDate) {
        where.createdAt = {};

        if (startDate) {
            where.createdAt.gte = new Date(startDate);
        }

        if (endDate) {
            where.createdAt.lte = new Date(endDate);
        }
    }

    // status filtering
    if (status) {
        where.status = status;
    }

    const [appeals, totalAppeals] = await Promise.all([
        prisma.appeal.findMany({
            where,
            skip,
            take: limit,
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