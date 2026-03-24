import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


// Helpers

// Centralised authentication check
async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

// Fetch a location and ensure it belongs to the user
async function getOwnedLocation(id: string, userId: string) {
  const location = await prisma.savedLocation.findUnique({ where: { id } });
  if (!location || location.userId !== userId) return null;
  return location;
}


// DELETE: remove a saved location 

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();

    // Early return for unauthenticated users
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Ensure the location exists and belongs to the user
    const location = await getOwnedLocation(id, userId);
    if (!location) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Perform deletion
    await prisma.savedLocation.delete({ where: { id } });

    return NextResponse.json({ success: true });

  } catch (error) {
    // Fallback error handling for unexpected failures
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


// PATCH: rename a saved location 
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Ensure ownership before updating
    const location = await getOwnedLocation(id, userId);
    if (!location) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Parse and validate input
    const { label } = await req.json();

    const trimmedLabel = label?.trim();
    if (!trimmedLabel) {
      return NextResponse.json({ error: "Label required" }, { status: 400 });
    }

    // Update label
    const updated = await prisma.savedLocation.update({
      where: { id },
      data: { label: trimmedLabel },
    });

    return NextResponse.json(updated);

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}