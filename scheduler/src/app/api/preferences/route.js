import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { userID, ...preferencesData } = body;

    if (!userID) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: userID },
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
        userId: userID,
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
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
