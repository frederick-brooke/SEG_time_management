import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        await prisma.report.update({
            where: { id: reportId },
            data: { status: "RESOLVED" }
        });
    }
    catch(e){
        console.error(e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }    

    return NextResponse.json({ success: true });
}