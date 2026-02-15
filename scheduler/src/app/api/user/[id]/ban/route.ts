import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function Patch(req: Request, { params}){
    const { type, durationDays } = await req.json();

    if (type === "TEMP"){
        const expires = new Date();
        expires.setDate(expires.getDate() + durationDays);

        await prisma.user.update({
            where: { id: params.id },
            data: {
                isBanned: true,
                banExpires: expires,
            },
        });
    }

    if (type === "PERMANENT"){
        await prisma.user.update({
            where: { id: params.id },
            data: {
                isBanned: true,
                banExpires: null,
            },
        });
    }

    if (type === "UNBAN"){
        await prisma.user.update({
            where: { id: params.id },
            data: {
                isBanned: false,
                banExpires: null,
            },
        });
    }

    return NextResponse.json({ success: true });
}