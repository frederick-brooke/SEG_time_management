import { NextRequest, NextResponse } from "next/server";
import { hashPassword, validatePassword } from "lib/password";
import { prisma } from "lib/prisma";

/**
 * helper function to validate username, only allow letters, numbers, underscores and hyphens
 * 3-20 chars
 * @param username the user made to validate
 * @returns boolean value
 */
function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}
/**
 * Handles user registration
 * @param req - the request object containing username, email, password
 * @returns JSON response with user data or error
 */
export async function POST(req: NextRequest) {
  try {
    const {
      username,
      email,
      password,
      fname = "",
      lname = "",
    } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 },
      );
    }
    //validate username format
    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens",
        },
        { status: 400 },
      );
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 },
      );
    }

    //check if email already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 },
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
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

    await prisma.category.createMany({
      data: [
        { userId: user.id, name: "Lecture", color: "#6366f1" },
        { userId: user.id, name: "Individual Study", color: "#10b981" },
        { userId: user.id, name: "Exam", color: "#ef4444" },
        { userId: user.id, name: "Personal", color: "#f59e0b" },
        { userId: user.id, name: "Lab", color: "#8b5cf6" },
      ],
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
