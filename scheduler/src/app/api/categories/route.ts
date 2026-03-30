/**
 * API route for managing user categories.
 *
 * Provides CRUD operations for authenticated users.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Retrieves all categories for the authenticated user.
 *
 * @param {NextRequest} req - Incoming request object
 * @returns {Promise<NextResponse>} JSON response containing user categories or error
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ categories });
}

/**
 * Retrieves all categories for the authenticated user.
 *
 * @param {NextRequest} req - Incoming request object
 * @returns {Promise<NextResponse>} JSON response containing user categories or error
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color } = await req.json();
  if (!name || !color)
    return NextResponse.json(
      { error: "Name and color required" },
      { status: 400 },
    );

  const category = await prisma.category.create({
    data: { name, color, userId: session.user.id },
  });
  return NextResponse.json({ category });
}

/**
 * Updates an existing category belonging to the authenticated user.
 *
 * Requires category ID and optional updated name/color fields.
 *
 * @param {NextRequest} req - Incoming request containing update data
 * @returns {Promise<NextResponse>} JSON response with updated category or error
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, color } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const category = await prisma.category.update({
    where: { id },
    data: { name, color },
  });
  return NextResponse.json({ category });
}

/**
 * Deletes a category for the authenticated user.
 *
 * Prevents deletion if it would leave the user with no categories.
 *
 * @param {NextRequest} req - Incoming request containing category ID
 * @returns {Promise<NextResponse>} JSON response confirming deletion or error
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Ensure at least one category always remains
  const count = await prisma.category.count({
    where: { userId: session.user.id },
  });
  if (count <= 1)
    return NextResponse.json(
      { error: "Cannot delete last category" },
      { status: 400 },
    );

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
