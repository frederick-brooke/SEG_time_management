/**
 * User registration API route.
 *
 * Validates username, email, and password, checks for duplicates,
 * creates a new user with default progress and category setup,
 * and returns the created user (excluding password hash).
 */

import { NextRequest, NextResponse } from "next/server";
import { hashPassword, validatePassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

/**
 * Validates username: letters, numbers, underscores and hyphens.
 */
function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Handles user registration.
 *
 * @param {NextRequest} req - Incoming registration request
 * @returns {Promise<NextResponse>} JSON response with created user or error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      username,
      email,
      password,
      fname = "",
      lname = "",
    } = body;

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 },
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters (letters, numbers, _ or - only)" },
        { status: 400 },
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      const isDuplicateEmail = existingUser.email.toLowerCase() === email.toLowerCase();
      return NextResponse.json(
        { error: isDuplicateEmail ? "Email already exists" : "Username already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          username,
          fname,
          lname,
          progress: { create: { points: 0, level: 1 } }
        },
      });

      await tx.category.createMany({
        data: [
          { userId: user.id, name: "Lecture", color: "#6366f1" },
          { userId: user.id, name: "Individual Study", color: "#10b981" },
          { userId: user.id, name: "Exam", color: "#ef4444" },
          { userId: user.id, name: "Personal", color: "#f59e0b" },
          { userId: user.id, name: "Lab", color: "#8b5cf6" },
        ],
      });

      return user;
    });

    const { passwordHash: _, ...userWithoutPassword } = result;

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (err) {
    console.error("REGISTRATION_ERROR:", err);
    return NextResponse.json({ error: "Failed to register account" }, { status: 500 });
  }
}