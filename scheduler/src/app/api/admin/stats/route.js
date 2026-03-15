import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [totalUsers, totalReports, totalAppeals] = await Promise.all([
      prisma.user.count(),
      prisma.report.count(),
      prisma.appeal.count()
    ]);

    return NextResponse.json({
      totalUsers,
      totalReports,
      totalAppeals
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch admin statistics" },
      { status: 500 }
    );
  }
}