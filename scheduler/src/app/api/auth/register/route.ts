import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "lib/password";
import { prisma } from "lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, fname = "", lname = "" } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
        fname,
        lname,
      },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}