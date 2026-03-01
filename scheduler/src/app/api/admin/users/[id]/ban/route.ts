import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
    req: Request, { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERUSER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { type, durationDays, reportId } = await req.json();

    console.log("Resolved ID:", id);

    if (!id) {
        throw new Error("User ID missing for ban action");
    }

    try{
        if (type === "TEMP"){
            const expires = new Date();
            expires.setDate(expires.getDate() + durationDays);

            await prisma.user.update({
                where: { id },
                data: {
                    isBanned: true,
                    banExpires: expires,
                },
            });
        }

        if (type === "PERMANENT"){
            await prisma.user.update({
                where: { id },
                data: {
                    isBanned: true,
                    banExpires: null,
                },
            });
        }

        if (type === "UNBAN"){
            await prisma.user.update({
                where: { id },
                data: {
                    isBanned: false,
                    banExpires: null,
                },
            });
        }

        if (reportId) {
            await prisma.report.update({
            where: { id: reportId },
            data: {
                status: "RESOLVED",
                handledById: session.user.id,
            },
            });
        }
    }
    catch(e){
        console.error(e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }    

    return NextResponse.json({ success: true });
}