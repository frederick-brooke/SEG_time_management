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
 * Type representing either parsed credentials or an error response.
 */
type ParseResult = { ok: true; token: string; password: string } | { ok: false; response: NextResponse };

/**
 * Validates request contains required token and password fields.
 * Returns parsed credentials or error response.
 */
async function parseResetRequest(
  req: NextRequest
): Promise<ParseResult> {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Token is required" },
          { status: 400 }
        ),
      };
    }

    if (!password || typeof password !== "string") {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Password is required" },
          { status: 400 }
        ),
      };
    }

    return { ok: true, token, password };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Finds user with valid reset token and expires date.
 * Returns user or null if not found or missing expiry.
 */
async function findUserWithResetToken(token: string) {
  return prisma.user.findFirst({
    where: {
      passwordResetToken: token,
    },
  });
}

/**
 * Checks if password reset token has expired.
 * Returns true if expired, false otherwise.
 */
function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return expiresAt <= new Date();
}

/**
 * Validates password format using password rules.
 * Returns error message or null if valid.
 */
function validatePasswordFormat(password: string): string | null {
  return validatePassword(password);
}

/**
 * Hashes password and updates user in database.
 * Clears reset token and expiry after successful update.
 */
async function updateUserPassword(
  userId: string,
  password: string
): Promise<void> {
  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}

/**
 * Resets a user's password using a valid password reset token.
 *
 * @param {NextRequest} req - Incoming request containing token and new password
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 */
export async function POST(req: NextRequest) {
  try {
    const result = await parseResetRequest(req);
    if (result.ok === false) return result.response;

    const { token, password } = result;

    const user = await findUserWithResetToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    if (isTokenExpired(user.passwordResetExpires)) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const passwordError = validatePasswordFormat(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    await updateUserPassword(user.id, password);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to reset password" },
      { status: 500 }
    );
  }
}
