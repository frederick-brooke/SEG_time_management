import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req, context){
    const params = await context.params;
    const { id } = params;
    const { type, durationDays } = await req.json();

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

    return NextResponse.json({ success: true });
}