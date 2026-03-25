import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
interface PreferencesBody {
  userId: string;
  workStartTime?: string;
  workEndTime?: string;
  daysOff?: string[];
  sessionLength?: number;
  breakLength?: number;
  breaksPerDay?: number;
  taskOrder?: string;
  maxTasksPerDay?: number;
  defaultTaskDuration?: number;
  reminderDays?: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    return NextResponse.json({ hasPreferences: !!preferences });
  } catch (error) {
    console.error("Failed to check preferences:", error);
    return NextResponse.json(
      { error: "Failed to check preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: PreferencesBody = await request.json();
    const { userId, ...preferencesData } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: userId },
      update: {
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
      create: {
        userId: userId,
        workStartTime: preferencesData.workStartTime || "09:00",
        workEndTime: preferencesData.workEndTime || "17:00",
        daysOff: preferencesData.daysOff || [],
        sessionLength: preferencesData.sessionLength || 60,
        breakLength: preferencesData.breakLength || 15,
        breaksPerDay: preferencesData.breaksPerDay || 3,
        taskOrder: preferencesData.taskOrder || "priority",
        maxTasksPerDay: preferencesData.maxTasksPerDay || 10,
        defaultTaskDuration: preferencesData.defaultTaskDuration || 30,
        reminderDays: preferencesData.reminderDays || 1,
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