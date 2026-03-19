import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Auth helper
 */
async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 as const };
  }
  return { userId: session.user.id };
}

/**
 * Validate location input
 */
function validateLocation(body: any) {
  const { label, address, lat, lng, type } = body;

  if (
    typeof label !== "string" ||
    !label.trim() ||
    typeof address !== "string" ||
    !address.trim() ||
    typeof lat !== "number" ||
    typeof lng !== "number"
  ) {
    return { error: "Invalid input", status: 400 as const };
  }

  const validTypes = ["HOME", "WORK", "FAVOURITE"] as const;
  const locationType = validTypes.includes(type) ? type : "FAVOURITE";

  return {
    data: {
      label: label.trim(),
      address: address.trim(),
      lat,
      lng,
      type: locationType,
    },
  };
}

// GET
export async function GET() {
  try {
    const auth = await requireUser();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const locations = await prisma.savedLocation.findMany({
      where: { userId: auth.userId },
      orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("GET /savedLocation failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const validation = validateLocation(body);

    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { data } = validation;

    if (data.type === "HOME" || data.type === "WORK") {
      await prisma.savedLocation.deleteMany({
        where: { userId: auth.userId, type: data.type },
      });
    }

    const saved = await prisma.savedLocation.create({
      data: {
        userId: auth.userId,
        ...data,
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("POST /savedLocation failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}