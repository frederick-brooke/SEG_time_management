/**
 * Saved Location API
 * DELETE: removes a user-owned saved location.
 * PATCH: updates label for a user-owned saved location.
 * Requires auth + ownership checks; wrapped in error handler.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Types

type RouteParams = { params: Promise<{ id: string }> };
type Handler = (req: NextRequest, ctx: RouteParams) => Promise<Response>;

// Helpers

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

async function getOwnedLocation(id: string, userId: string) {
  const location = await prisma.savedLocation.findUnique({ where: { id } });
  if (!location || location.userId !== userId) return null;
  return location;
}

function withErrorHandling(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error: unknown) {
      console.error(error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

function unauthorised() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// DELETE

export const DELETE = withErrorHandling(async (_req, { params }) => {
  const userId = await requireUserId();
  if (!userId) return unauthorised();

  const { id } = await params;
  const location = await getOwnedLocation(id, userId);
  if (!location) return notFound();

  await prisma.savedLocation.delete({ where: { id } });
  return NextResponse.json({ success: true });
});

// PATCH 

export const PATCH = withErrorHandling(async (req, { params }) => {
  const userId = await requireUserId();
  if (!userId) return unauthorised();

  const { id } = await params;
  const location = await getOwnedLocation(id, userId);
  if (!location) return notFound();

  const { label } = await req.json();
  const trimmedLabel = label?.trim();
  if (!trimmedLabel) {
    return NextResponse.json({ error: "Label required" }, { status: 400 });
  }

  const updated = await prisma.savedLocation.update({
    where: { id },
    data: { label: trimmedLabel },
  });
  return NextResponse.json(updated);
});
