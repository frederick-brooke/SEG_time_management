/**
 * Password reset API route.
 *
 * Validates reset token and new password, checks expiration,
 * hashes the new password, and updates the user account while
 * clearing reset credentials.
 */

import { NextRequest, NextResponse } from "next/server";
import { hashPassword, validatePassword } from "lib/password";
import { prisma } from "lib/prisma";

/**
 * Resets a user's password using a valid password reset token.
 * 
 * @param {NextRequest} req - Incoming request containing token and new password
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 */
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
      },
    });

    if (!user || !user.passwordResetExpires) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const now = new Date();
    if (user.passwordResetExpires < now) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unable to reset password" }, { status: 500 });
  }
}
