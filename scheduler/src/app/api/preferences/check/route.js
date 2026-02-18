import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { Status: 400 });
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });
    return NextResponse.json({ hasPreferences: !!preferences });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    // Get the data from the request body
    const body = await request.json();

    const { userId, ...preferencesData } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const preferences = await prisma.userPreferences.create({
      data: {
        userId: userId,
        workStartTime: preferencesData.workStartTime,
        workEndTime: preferencesData.workEndTime,
        daysOff: preferencesData.daysOff,
        sessionLength: preferencesData.sessionLength,
        breakLength: preferencesData.breakLength,
        breaksPerDay: preferencesData.breaksPerDay,
        taskOrder: preferencesData.taskOrder,
        maxTasksPerDay: preferencesData.maxTasksPerDay,
        defaultTaskDuration: preferencesData.defaultTaskDuration,
        reminderDays: preferencesData.reminderDays,
      },
    });

    return NextResponse.json({ success: true, preferences });
    
  } catch (error) {
    console.error("Failed to save preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
