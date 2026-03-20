import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "lib/prisma";
import { sendPasswordResetEmail } from "lib/maileroo";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond with 200 for security (avoid revealing if email exists)
    if (!user || !user.passwordHash) {
      return NextResponse.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        // passwordResetToken: token,
        // passwordResetExpires: expires,
      },
    });

    const origin = req.nextUrl?.origin ?? process.env.NEXTAUTH_URL ?? "";
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.username,
      resetUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to process reset request" },
      { status: 500 },
    );
  }
}
