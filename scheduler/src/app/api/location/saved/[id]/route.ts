import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

//Authenticate user
 
async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 as const };
  }
  return { userId: session.user.id };
}

// Get location and verify ownership
 
async function getUserLocation(userId: string, id: string) {
  const location = await prisma.savedLocation.findUnique({
    where: { id },
  });

  if (!location || location.userId !== userId) {
    return { error: "Not found", status: 404 as const };
  }

  return { location };
}

/**
 * Helper: Validate label
 */
function validateLabel(label: unknown) {
  if (typeof label !== "string" || !label.trim()) {
    return { error: "Label required", status: 400 as const };
  }
  return { label: label.trim() };
}

// DELETE
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const result = await getUserLocation(auth.userId, id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await prisma.savedLocation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /savedLocation failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH (rename)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const result = await getUserLocation(auth.userId, id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await req.json();
    const validation = validateLabel(body.label);

    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const updated = await prisma.savedLocation.update({
      where: { id },
      data: { label: validation.label },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /savedLocation failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}