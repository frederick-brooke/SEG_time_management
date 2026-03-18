import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET /api/preferences?userId=xxx
// Returns the user's saved preferences, or null if none exist yet.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });
    return NextResponse.json({ preferences: preferences ?? null });
  } catch (error) {
    console.error("GET preferences error:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/preferences
// Creates or updates preferences for the given user.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userID, ...preferencesData } = body;

    if (!userID) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const preferences = await prisma.userPreferences.upsert({
      where:  { userId: userID },
      update: {
        workStartTime:       preferencesData.workStartTime,
        workEndTime:         preferencesData.workEndTime,
        daysOff:             preferencesData.daysOff,
        sessionLength:       preferencesData.sessionLength,
        breakLength:         preferencesData.breakLength,
        breaksPerDay:        preferencesData.breaksPerDay,
        taskOrder:           preferencesData.taskOrder,
        maxTasksPerDay:      preferencesData.maxTasksPerDay,
        defaultTaskDuration: preferencesData.defaultTaskDuration,
        reminderDays:        preferencesData.reminderDays,
      },
      create: {
        userId:              userID,
        workStartTime:       preferencesData.workStartTime       ?? "09:00",
        workEndTime:         preferencesData.workEndTime         ?? "17:00",
        daysOff:             preferencesData.daysOff             ?? [],
        sessionLength:       preferencesData.sessionLength       ?? 90,
        breakLength:         preferencesData.breakLength         ?? 15,
        breaksPerDay:        preferencesData.breaksPerDay        ?? 3,
        taskOrder:           preferencesData.taskOrder           ?? "hard-first",
        maxTasksPerDay:      preferencesData.maxTasksPerDay      ?? 8,
        defaultTaskDuration: preferencesData.defaultTaskDuration ?? 60,
        reminderDays:        preferencesData.reminderDays        ?? 2,
      },
    });

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error("Failed to save preferences:", error);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}