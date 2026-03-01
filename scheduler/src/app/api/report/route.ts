import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { reportedUserId, reason, description } = body;

        if(!reportedUserId || !reason) {
            return NextResponse.json(
                { error: "Missing mandatory fields!"},
                { status: 400 }
            );
        }

        const report = await prisma.report.create({
            data: {
                reportedUserId,
                reportedById: session.user.id,
                reason,
                description,
            },
        });

        return NextResponse.json({success: true, report});
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create report" },
            { status: 500 }
        );
    } 
}