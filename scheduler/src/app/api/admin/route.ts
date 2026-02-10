//backend logic using PRISMA to query statistics for admin side
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

import { cookies } from "next/headers";


export async function GET() {
    const cookieStore = await cookies();
    console.log("COOKIES:", cookieStore.getAll());

    const session = await getServerSession(authOptions);

    console.log("SESSION:", session);
    
    if(!session){
        return NextResponse.json(
            {error: "Unauthorised"},
            {status: 401}
        );
    }

    const totalUsers = await prisma.user.count();

    return NextResponse.json({
        totalUsers,
    });
}