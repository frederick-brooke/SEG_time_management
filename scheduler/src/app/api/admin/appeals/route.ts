import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    const skip = (page - 1) * limit;

    const [appeals, totalAppeals] = await Promise.all([
        prisma.appeal.findMany({
        skip,
        take: limit,
        include: { user: true, report: true },
        orderBy: { createdAt: "desc" },
        }),
        prisma.appeal.count(),
    ]);

    return NextResponse.json({
        appeals,
        totalAppeals,
        totalAppealPages: Math.ceil(totalAppeals / limit),
    });
}