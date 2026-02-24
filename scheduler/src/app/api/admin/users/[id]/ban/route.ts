import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const { type, durationDays } = await req.json();

    console.log("Ban route ID:", id);

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
            const result = await prisma.user.updateMany({
                where: { id },
                data: {
                    isBanned: true,
                    banExpires: null,
                },
            });

            console.log("Update result:", result);
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
    }
    catch(e){
        console.error(e);
    }    

    return NextResponse.json({ success: true });
}